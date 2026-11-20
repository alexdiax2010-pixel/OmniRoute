import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { normalizarEtapa, normalizarFecha, normalizarFila, normalizarLista, normalizarNumero, fusionar } from "@/lib/crm/normalizar";
import { importarProspectos } from "@/lib/crm/importar";
import { localRepo } from "@/lib/data/local";
import { slugify, carpetaDeBoceto, numeroWhatsApp, slugUnico } from "@/lib/crm/texto";

const dir = mkdtempSync(path.join(tmpdir(), "sky-crm-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("normalización", () => {
  it("etapa sin importar mayúsculas ni acentos", () => {
    expect(normalizarEtapa("nuevo").etapa).toBe("Nuevo");
    expect(normalizarEtapa("BOCETO ENVIADO").etapa).toBe("Boceto enviado");
    expect(normalizarEtapa("negociación").etapa).toBe("Negociando");
    expect(normalizarEtapa("Ganado").etapa).toBe("Ganado");
    const x = normalizarEtapa("Quién sabe");
    expect(x.etapa).toBe("Nuevo");
    expect(x.aviso).toMatch(/desconocida/);
  });
  it("fechas a YYYY-MM-DD o null", () => {
    expect(normalizarFecha("2026-11-20")).toBe("2026-11-20");
    expect(normalizarFecha("2026-11-20T10:00:00Z")).toBe("2026-11-20");
    expect(normalizarFecha("5/1/2027")).toBe("2027-01-05");
    expect(normalizarFecha("31/02/2026")).toBeNull();
    expect(normalizarFecha("mañana")).toBeNull();
    expect(normalizarFecha("")).toBeNull();
    expect(normalizarFecha(null)).toBeNull();
  });
  it("números", () => {
    expect(normalizarNumero("$4,500.50")).toBe(4500.5);
    expect(normalizarNumero(12)).toBe(12);
    expect(normalizarNumero("abc")).toBeNull();
    expect(normalizarNumero("")).toBeNull();
  });
  it("fila: id numérico → texto, alertas string → arreglo, solo campos presentes", () => {
    const { parcial, avisos } = normalizarFila(
      { id: 7, nombre: "Ejemplo", alertas: "revisar número", top10: "sí", puntaje: "80", servicios: ["Web", "menu qr", "tiktok"], diaCobro: 40 },
      0,
    );
    expect(parcial.id).toBe("7");
    expect(parcial.alertas).toEqual(["revisar número"]);
    expect(parcial.top10).toBe(true);
    expect(parcial.puntaje).toBe(80);
    expect(parcial.servicios).toEqual(["web", "menuqr"]);
    expect(parcial.diaCobro).toBeNull();
    expect("etapa" in parcial).toBe(false);
    expect("colonia" in parcial).toBe(false);
    expect(avisos.join(" ")).toMatch(/tiktok/);
    expect(avisos.join(" ")).toMatch(/diaCobro/);
  });
  it("reporta el índice de la fila inválida", () => {
    const { filas, errores } = normalizarLista([{ id: 1, nombre: "Ok" }, { nombre: "Sin id" }, { id: 3 }, { id: 1, nombre: "Repetido" }]);
    expect(filas).toHaveLength(1);
    expect(errores.map((e) => e.indice)).toEqual([1, 2, 3]);
    expect(errores[0].mensaje).toMatch(/^Fila 1:/);
    expect(errores[2].mensaje).toMatch(/repetido/);
  });
  it("archivo que no es arreglo", () => {
    expect(normalizarLista({ hola: 1 }).errores).toHaveLength(1);
    expect(normalizarLista({ prospectos: [{ id: 1, nombre: "a" }] }).filas).toHaveLength(1);
  });
  it("fusionar conserva campos ausentes y une notas", () => {
    const existente = fusionar(null, { id: "1", nombre: "A", colonia: "Centro", notas: [{ t: "1", txt: "vieja" }] });
    const r = fusionar(existente, { id: "1", nombre: "A2", notas: [{ t: "1", txt: "vieja" }, { t: "2", txt: "nueva" }] });
    expect(r.nombre).toBe("A2");
    expect(r.colonia).toBe("Centro");
    expect(r.notas.map((n) => n.txt)).toEqual(["vieja", "nueva"]);
    expect(r.creado).toBe(existente.creado);
  });
});

describe("utilidades", () => {
  it("slugify / slugUnico", () => {
    expect(slugify("Taller Ramírez & Hijos")).toBe("taller-ramirez-hijos");
    expect(slugify("¡¡¡")).toBe("sitio");
    expect(slugUnico("demo", ["demo", "demo-2"])).toBe("demo-3");
    expect(slugUnico("admin", [], ["admin"])).toBe("admin-2");
  });
  it("carpetaDeBoceto", () => {
    expect(carpetaDeBoceto("clientes/taller-x/index.html")).toBe("taller-x");
    expect(carpetaDeBoceto("taller-x")).toBe("taller-x");
    expect(carpetaDeBoceto("../etc")).toBeNull();
    expect(carpetaDeBoceto("https://x.com/a")).toBeNull();
    expect(carpetaDeBoceto("")).toBeNull();
  });
  it("numeroWhatsApp agrega 52", () => {
    expect(numeroWhatsApp("33 0000 0001")).toBe("523300000001");
    expect(numeroWhatsApp("523300000001")).toBe("523300000001");
    expect(numeroWhatsApp("123")).toBeNull();
  });
});

describe("importarProspectos (repo local)", () => {
  beforeEach(() => {
    process.env.SKY_DATA_FILE = path.join(dir, `db-${Math.random().toString(36).slice(2)}.json`);
  });

  const ejemplo = JSON.parse(readFileSync(path.join(process.cwd(), "data/crm-prospectos.ejemplo.json"), "utf8"));

  it("importa el ejemplo y es idempotente", async () => {
    const r1 = await importarProspectos(localRepo, ejemplo);
    expect(r1).toMatchObject({ total: 3, insertados: 3, actualizados: 0, errores: [] });
    const r2 = await importarProspectos(localRepo, ejemplo);
    expect(r2).toMatchObject({ insertados: 0, actualizados: 3 });
    const lista = await localRepo.listarProspectos();
    expect(lista).toHaveLength(3);
    const dos = lista.find((p) => p.id === "ej-2")!;
    expect(dos.etapa).toBe("Negociando");
    expect(dos.seguimiento).toBe("2026-11-25");
    expect(dos.monto).toBe(4500);
    expect(dos.notas).toHaveLength(1);
    expect(await localRepo.prospectoIdPorEmail("CLIENTE@sky.test")).toBe("3");
  });

  it("conserva ediciones del CRM en campos ausentes del JSON", async () => {
    await importarProspectos(localRepo, [{ id: 1, nombre: "Uno", colonia: "A" }]);
    await localRepo.actualizarProspecto("1", { email: "x@y.mx", monto: 999 });
    await localRepo.agregarNota("1", { t: "2026-11-20T00:00:00Z", txt: "nota CRM" });
    await importarProspectos(localRepo, [{ id: 1, nombre: "Uno bis", colonia: "B" }]);
    const p = (await localRepo.obtenerProspecto("1"))!;
    expect(p).toMatchObject({ nombre: "Uno bis", colonia: "B", email: "x@y.mx", monto: 999 });
    expect(p.notas.map((n) => n.txt)).toEqual(["nota CRM"]);
  });

  it("no escribe nada si hay errores", async () => {
    const r = await importarProspectos(localRepo, [{ id: 1, nombre: "Ok" }, { id: 2 }]);
    expect(r.errores).toHaveLength(1);
    expect(r.insertados).toBe(0);
    expect(await localRepo.listarProspectos()).toHaveLength(0);
  });

  it("una solicitud de cambio agrega nota [Portal]", async () => {
    await importarProspectos(localRepo, [{ id: 9, nombre: "Nueve" }]);
    await localRepo.crearSolicitudCambio({ prospecto_id: "9", texto: "Cambiar horario", foto: "9/abc.png" });
    const p = (await localRepo.obtenerProspecto("9"))!;
    expect(p.notas.at(-1)?.txt).toBe("[Portal] Cambiar horario — foto: 9/abc.png");
  });
});

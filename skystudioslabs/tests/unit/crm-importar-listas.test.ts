import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { normalizarCategoria, normalizarGiro } from "@/lib/crm/giros";
import { digitosMX, limpiarDireccion, limpiarTelefono } from "@/lib/crm/contacto";
import { normalizarFila } from "@/lib/crm/normalizar";
import { claveNombre, importarProspectos } from "@/lib/crm/importar";
import { leerEntrada } from "@/lib/crm/archivos";
import { localRepo } from "@/lib/data/local";

/** Formato de las listas de prospección (un .json por negocio, sin id). Datos 100% FICTICIOS. */
const fila = (o: Record<string, unknown> = {}) => ({
  nombre: "Dental Ficticio Uno",
  giro: "Consultorio dental en Colonia Inventada",
  categoria: "salud",
  colonia: "Colonia Inventada",
  direccion: "Calle Falsa 123 (FICTICIO)",
  telefono: "(33) 0000 0001",
  whatsapp: "",
  puntaje: 50,
  razon: "Ejemplo",
  alertas: "Verificar horario; Confirmar dueño",
  sesion: 2,
  top10: false,
  etapa: "nuevo",
  seguimiento: "",
  notas: [],
  mensaje: "",
  guion: "",
  boceto: "",
  fuente: "ejemplo",
  ...o,
});

const dir = mkdtempSync(path.join(tmpdir(), "sky-listas-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("giros y categorías", () => {
  it("agrupa variantes con distinta mayúscula, acento o detalle", () => {
    for (const g of ["Dentista", "dentista", "Consultorio dental", "Clínica dental", "Clínica dental en Zapopan, Jalisco", "Consultorio de ortodoncia", "Cirugía oral y estética dental en La Estancia"]) {
      expect(normalizarGiro(g)).toBe("Dentista");
    }
    expect(normalizarGiro("barbería")).toBe("Barbería");
    expect(normalizarGiro("Estética y barbería en Ejido X")).toBe("Barbería");
    expect(normalizarGiro("Taller de transmisiones automáticas")).toBe("Taller mecánico");
    expect(normalizarGiro("Taller mecánico (según directorio)")).toBe("Taller mecánico");
    expect(normalizarGiro("fisioterapia y rehabilitación (rodilla)")).toBe("Fisioterapia");
    expect(normalizarGiro("veterinaria / farmacia veterinaria")).toBe("Veterinaria");
  });
  it("giro genérico: se deduce del nombre solo si es claro", () => {
    expect(normalizarGiro("salud", "Dental Ficticio")).toBe("Dentista");
    expect(normalizarGiro("automotriz", "Laminado y Pintura Ficticia")).toBe("Hojalatería y pintura");
    expect(normalizarGiro("salud", "Clínica Ficticia")).toBe("Salud");
    expect(normalizarGiro("oficios")).toBe("Oficios");
  });
  it("giro desconocido: limpio y con mayúscula inicial", () => {
    expect(normalizarGiro("  florería en Colonia X ")).toBe("Florería");
    expect(normalizarGiro("")).toBe("");
  });
  it("categoría", () => {
    expect(normalizarCategoria("salud")).toBe("Salud");
    expect(normalizarCategoria("AUTOMOTRIZ")).toBe("Automotriz");
    expect(normalizarCategoria("otra cosa")).toBe("Otra cosa");
  });
});

describe("teléfonos y dirección", () => {
  it("número limpio a 10 dígitos, con formato", () => {
    expect(limpiarTelefono("(33) 0000-0001", "Teléfono")).toEqual({ valor: "33 0000 0001" });
    expect(limpiarTelefono("+52 33 0000 0001", "Teléfono")).toEqual({ valor: "33 0000 0001" });
    expect(limpiarTelefono("WA 33 0000 0001", "WhatsApp")).toEqual({ valor: "33 0000 0001" });
    expect(limpiarTelefono(3120000001, "Teléfono")).toEqual({ valor: "312 000 0001" });
  });
  it("texto extra: primer número + alerta con el original", () => {
    const r = limpiarTelefono("(33) 0000 0001 / (33) 0000 0002", "Teléfono");
    expect(r.valor).toBe("33 0000 0001");
    expect(r.alerta).toMatch(/dato original.*0000 0002/);
    expect(limpiarTelefono("+52 33 0000 0001 (verificar en Maps)", "Teléfono").alerta).toMatch(/verificar/);
  });
  it("no encontrado / posible / dudoso → vacío + alerta (no se inventa contacto)", () => {
    for (const t of ["no encontrado", "WA no encontrado (formato de celular; verificar)", "posible +52 33 0000 0001 (VERIFICAR)", "(33) 0000 0001 (asignación dudosa)", "(33) 0000 0001 (posible, no confirmado)"]) {
      const r = limpiarTelefono(t, "Teléfono");
      expect(r.valor).toBe("");
      expect(r.alerta).toContain(t);
    }
    expect(limpiarTelefono("123", "Teléfono")).toMatchObject({ valor: "", alerta: expect.stringMatching(/no reconocido/) });
  });
  it("dirección", () => {
    expect(limpiarDireccion("no encontrado (verificar en Maps)")).toMatchObject({ valor: "", alerta: expect.stringMatching(/Dirección/) });
    expect(limpiarDireccion("Calle Falsa 1")).toEqual({ valor: "Calle Falsa 1" });
  });
  it("digitosMX", () => {
    expect(digitosMX("+521 33 0000 0001")).toBe("3300000001");
    expect(digitosMX("12345")).toBeNull();
  });
});

describe("fila de lista de prospección", () => {
  it("normaliza giro, categoría, etapa, teléfono y alertas separadas por ';'", () => {
    const { parcial } = normalizarFila({ id: "dental-1", ...fila({ telefono: "no encontrado", direccion: "no encontrado", puntaje: null }) }, 0);
    expect(parcial).toMatchObject({ giro: "Dentista", categoria: "Salud", etapa: "Nuevo", telefono: "", direccion: "", sesion: "2", puntaje: 0, seguimiento: null });
    expect(parcial.alertas).toEqual(["Verificar horario", "Confirmar dueño", "Teléfono sin confirmar: no encontrado", "Dirección sin confirmar: no encontrado"]);
    expect(parcial.notas).toEqual([{ t: "", txt: "Giro original: Consultorio dental en Colonia Inventada" }]);
  });
});

describe("importar listas (carpeta, sin id)", () => {
  beforeEach(() => {
    process.env.SKY_DATA_FILE = path.join(dir, `db-${Math.random().toString(36).slice(2)}.json`);
  });

  function carpeta(archivos: Record<string, unknown>): string {
    const d = path.join(dir, `c-${Math.random().toString(36).slice(2)}`);
    mkdirSync(d);
    for (const [n, v] of Object.entries(archivos)) writeFileSync(path.join(d, n), typeof v === "string" ? v : JSON.stringify(v));
    return d;
  }

  it("lee una carpeta: id = nombre del archivo; es idempotente", async () => {
    const d = carpeta({
      "dental-uno.json": fila(),
      "taller-dos.json": fila({ nombre: "Taller Ficticio Dos", giro: "automotriz", categoria: "Automotriz", telefono: "+52 33 0000 0002" }),
      "leeme.txt": "no es json",
    });
    const e = leerEntrada(d);
    expect(e.archivos).toBe(2);
    expect(e.errores).toEqual([]);
    const r1 = await importarProspectos(localRepo, e.datos);
    expect(r1).toMatchObject({ total: 2, insertados: 2, actualizados: 0, duplicados: [], errores: [] });
    const r2 = await importarProspectos(localRepo, leerEntrada(d).datos);
    expect(r2).toMatchObject({ insertados: 0, actualizados: 2 });
    const lista = await localRepo.listarProspectos();
    expect(lista.map((p) => p.id).sort()).toEqual(["dental-uno", "taller-dos"]);
    const uno = lista.find((p) => p.id === "dental-uno")!;
    expect(uno.notas).toHaveLength(1); // la nota "Giro original" no se duplica al reimportar
    expect(uno.telefono).toBe("33 0000 0001");
  });

  it("un archivo con JSON inválido se reporta", () => {
    const d = carpeta({ "malo.json": "{", "bueno.json": fila() });
    expect(leerEntrada(d).errores).toEqual(["malo.json: no es JSON válido"]);
  });

  it("archivo con un objeto suelto", () => {
    const d = carpeta({ "suelto.json": fila() });
    expect(leerEntrada(path.join(d, "suelto.json")).datos).toEqual([{ ...fila(), id: "suelto" }]);
  });

  it("omite duplicados por nombre (aunque cambie acento/mayúsculas/sufijo legal) y avisa teléfono compartido", async () => {
    await importarProspectos(localRepo, [{ id: "a", ...fila({ nombre: "Taller Ficticio, S.A. de C.V." }) }]);
    const r = await importarProspectos(localRepo, [
      { id: "b", ...fila({ nombre: "TALLER FICTICIO" }) },
      { id: "c", ...fila({ nombre: "Otro Negocio Ficticio" }) },
      { id: "d", ...fila({ nombre: "otro negocio ficticio" }) },
    ]);
    expect(r.duplicados.map((x) => [x.id, x.de])).toEqual([
      ["b", "a"],
      ["d", "c"],
    ]);
    expect(r.insertados).toBe(1);
    expect(r.avisos.join(" ")).toMatch(/comparte teléfono con "a"/);
    expect((await localRepo.listarProspectos()).map((p) => p.id).sort()).toEqual(["a", "c"]);
  });

  it("claveNombre", () => {
    expect(claveNombre("Auto Express Ficticio SA de CV")).toBe(claveNombre("auto express ficticio"));
    expect(claveNombre("Clínica Ñandú S.C.")).toBe("clinicanandu");
  });
});

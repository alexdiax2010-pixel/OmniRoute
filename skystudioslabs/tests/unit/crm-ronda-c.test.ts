import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { dividirAlertas, idDeArchivo, limpiarValor, normalizarSeed, seedsAImportables } from "@/lib/crm/seed-rama";
import { normalizarLista } from "@/lib/crm/normalizar";
import { importarProspectos } from "@/lib/crm/importar";
import { localRepo } from "@/lib/data/local";
import { carpetaDeBoceto } from "@/lib/crm/texto";
import { aQuery, filtrarYOrdenar, hayFiltros, leerFiltros } from "@/lib/crm/lista";
import { seguimientosProximos } from "@/lib/crm/reglas";
import { prospectoBase } from "@/lib/data/base";
import { sitioDelCliente, solicitudesPortal, tienePlan, vistaPortal } from "@/lib/portal/vista";
import { COLUMNAS_INTERNAS } from "@/lib/data/supabase";

const dir = mkdtempSync(path.join(tmpdir(), "sky-c-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
beforeEach(() => {
  process.env.SKY_DATA_FILE = path.join(dir, `db-${Math.random().toString(36).slice(2)}.json`);
});

// Datos FICTICIOS con la forma de los seeds de la rama de prospección.
const seed = {
  nombre: "Taller Ficticio",
  giro: "Taller mecánico",
  categoria: "Automotriz",
  colonia: "no encontrado (verificar en Maps)",
  direccion: "no encontrado",
  telefono: "no encontrado",
  whatsapp: "no encontrado (formato de celular; verificar)",
  puntaje: 71,
  razon: "Sin web (+30)",
  alertas: "Verificar en Maps; Dato de directorio; Verificar en Maps",
  sesion: 2,
  top10: false,
  etapa: "nuevo",
  seguimiento: "",
  notas: [],
  mensaje: "",
  guion: "",
  boceto: "bocetos-zapopan/talleres/taller-ficticio",
  fuente: "https://ejemplo.invalid/ficha",
};

describe("seeds de la rama → crm:importar", () => {
  it("id desde el nombre de archivo, solo slugs seguros", () => {
    expect(idDeArchivo("resultados/crm/seed/taller-x.json")).toBe("taller-x");
    expect(idDeArchivo("../Malo.json")).toBeNull();
    expect(idDeArchivo("a b.json")).toBeNull();
  });
  it("'no encontrado' → vacío y el detalle se conserva aparte", () => {
    expect(limpiarValor("no encontrado")).toEqual({ valor: "", detalle: null });
    expect(limpiarValor("no encontrado (CP 45100)")).toEqual({ valor: "", detalle: "CP 45100" });
    expect(limpiarValor("N/A").valor).toBe("");
    expect(limpiarValor(" Av. Patria 10 (número no encontrado) ").valor).toBe("Av. Patria 10 (número no encontrado)");
  });
  it("alertas separadas por '; ' sin duplicados", () => {
    expect(dividirAlertas("a; b; a")).toEqual(["a", "b"]);
    expect(dividirAlertas("")).toEqual([]);
  });
  it("normaliza y omite campos vacíos o por defecto (no pisa ediciones del CRM al reimportar)", () => {
    const f = normalizarSeed("taller-ficticio", seed);
    expect(f).toMatchObject({ id: "taller-ficticio", nombre: "Taller Ficticio", puntaje: 71, sesion: "2", fuente: seed.fuente });
    for (const k of ["telefono", "whatsapp", "colonia", "direccion", "etapa", "seguimiento", "notas", "mensaje", "guion", "top10"]) expect(f).not.toHaveProperty(k);
    expect(f.alertas).toContain("WhatsApp no encontrado: formato de celular; verificar");
    expect((f.alertas as string[]).filter((a) => a === "Verificar en Maps")).toHaveLength(1);
    expect(normalizarSeed("x", { ...seed, puntaje: null, top10: true })).toMatchObject({ top10: true });
    expect(normalizarSeed("x", { ...seed, puntaje: null })).not.toHaveProperty("puntaje");
  });
  it("el resultado pasa la validación del importador y se ordena por puntaje", () => {
    const filas = seedsAImportables([
      { ruta: "s/b.json", datos: { ...seed, nombre: "B", puntaje: 50 } },
      { ruta: "s/a.json", datos: { ...seed, nombre: "A", puntaje: 90 } },
      { ruta: "s/c.json", datos: { ...seed, nombre: "C", puntaje: null } },
    ]);
    expect(filas.map((f) => f.id)).toEqual(["a", "b", "c"]);
    const { errores, filas: ok } = normalizarLista(filas);
    expect(errores).toEqual([]);
    expect(ok[0].parcial.etapa).toBeUndefined();
    expect(() => seedsAImportables([{ ruta: "a.json", datos: seed }, { ruta: "x/a.json", datos: seed }])).toThrow(/repetido/);
  });
  it("reimportar no borra la etapa, el seguimiento ni las notas; --solo-nuevos no toca existentes", async () => {
    const filas = seedsAImportables([{ ruta: "taller-ficticio.json", datos: seed }]);
    await importarProspectos(localRepo, filas);
    await localRepo.actualizarProspecto("taller-ficticio", { etapa: "Contactado", seguimiento: "2026-12-01", telefono: "3300000009" });
    await localRepo.agregarNota("taller-ficticio", { t: "2026-11-24T00:00:00Z", txt: "llamé" });
    await importarProspectos(localRepo, filas);
    let p = await localRepo.obtenerProspecto("taller-ficticio");
    expect(p).toMatchObject({ etapa: "Contactado", seguimiento: "2026-12-01", telefono: "3300000009" });
    expect(p!.notas.map((n) => n.txt)).toEqual(["llamé"]);
    const r = await importarProspectos(localRepo, [{ ...filas[0], razon: "nueva" }, { id: "otro", nombre: "Otro" }], { soloNuevos: true });
    expect(r).toMatchObject({ insertados: 1, actualizados: 0, omitidos: 1 });
    p = await localRepo.obtenerProspecto("taller-ficticio");
    expect(p!.razon).toBe("Sin web (+30)");
  });
});

describe("carpeta del boceto", () => {
  it("usa la última carpeta de la ruta de la rama de bocetos y rechaza rutas peligrosas", () => {
    expect(carpetaDeBoceto("bocetos-zapopan/dentistas/dr-llamas")).toBe("dr-llamas");
    expect(carpetaDeBoceto("clientes/taller-x/index.html")).toBe("taller-x");
    expect(carpetaDeBoceto("./taller-x/")).toBe("taller-x");
    expect(carpetaDeBoceto("bocetos/../../etc")).toBeNull();
    expect(carpetaDeBoceto("https://x.com/a")).toBeNull();
  });
});

describe("filtros de la lista del CRM", () => {
  const base = (o: Partial<ReturnType<typeof prospectoBase>>) => prospectoBase({ nombre: "X", giro: "", whatsapp: "", ...o });
  const lista = [
    base({ id: "1", nombre: "Dental Uno", categoria: "Salud", puntaje: 80, telefono: "3300000001", top10: true }),
    base({ id: "2", nombre: "Taller Dos", categoria: "Automotriz", puntaje: 60, boceto: "bocetos-zapopan/talleres/dos" }),
    base({ id: "3", nombre: "Spa Tres", categoria: "Belleza", puntaje: 40, direccion: "Calle Ficticia 1" }),
  ];
  it("lee y aplica categoría, puntaje mínimo, teléfono y boceto", () => {
    const ids = (q: Record<string, string>) => filtrarYOrdenar(lista, leerFiltros(q)).map((p) => p.id);
    expect(ids({})).toEqual(["1", "2", "3"]);
    expect(ids({ categoria: "salud" })).toEqual(["1"]);
    expect(ids({ min: "50" })).toEqual(["1", "2"]);
    expect(ids({ tel: "1" })).toEqual(["1"]);
    expect(ids({ boceto: "1" })).toEqual(["2"]);
    expect(ids({ q: "ficticia" })).toEqual(["3"]);
    expect(ids({ min: "abc" })).toEqual(["1", "2", "3"]);
  });
  it("query string ida y vuelta", () => {
    const f = leerFiltros({ categoria: "Salud", min: "50", top10: "1", tel: "1", boceto: "1" });
    expect(hayFiltros(f)).toBe(true);
    expect(leerFiltros(Object.fromEntries(new URLSearchParams(aQuery(f))))).toEqual(f);
    expect(hayFiltros(leerFiltros({ orden: "nombre" }))).toBe(false);
  });
  it("próximos seguimientos: después de hoy, hasta la fecha límite, sin cerrados", () => {
    const l = [
      { id: "a", etapa: "Contactado" as const, seguimiento: "2026-11-26" },
      { id: "b", etapa: "Negociando" as const, seguimiento: "2026-11-25" },
      { id: "c", etapa: "Ganado" as const, seguimiento: "2026-11-25" },
      { id: "d", etapa: "Contactado" as const, seguimiento: "2026-11-24" },
      { id: "e", etapa: "Contactado" as const, seguimiento: "2026-12-20" },
    ];
    expect(seguimientosProximos(l, "2026-11-24", "2026-12-01").map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("portal: solo lo del cliente", () => {
  const p = prospectoBase({
    id: "9", nombre: "Cliente", giro: "Estética", whatsapp: "3300000009", telefono: "3300000009", razon: "secreta",
    guion: "secreto", notas: [{ t: "", txt: "interna" }], paquete: "estandar", servicios: ["web"], email: "c@x.mx",
  });
  it("la vista del portal no lleva ningún dato interno", () => {
    const v = vistaPortal(p) as Record<string, unknown>;
    for (const c of COLUMNAS_INTERNAS) expect(v).not.toHaveProperty(c);
    expect(JSON.stringify(v)).not.toContain("3300000009");
    expect(v).not.toHaveProperty("email");
    expect(tienePlan(vistaPortal(p))).toBe(true);
    expect(tienePlan(vistaPortal(prospectoBase({ nombre: "Y", giro: "", whatsapp: "" })))).toBe(false);
  });
  it("sitio y solicitudes solo de su prospecto, sin rutas de foto", () => {
    const sitios = [
      { slug: "otro", tipo: "cliente" as const, prospecto_id: "1", carpeta: "otro", dominio_propio: null, activo: true, expira: null, creado: "" },
      { slug: "prop", tipo: "propuesta" as const, prospecto_id: "9", carpeta: "prop", dominio_propio: null, activo: true, expira: null, creado: "" },
      { slug: "suyo", tipo: "cliente" as const, prospecto_id: "9", carpeta: "suyo", dominio_propio: null, activo: true, expira: null, creado: "" },
    ];
    expect(sitioDelCliente(sitios, "9")?.slug).toBe("suyo");
    expect(sitioDelCliente(sitios, "5")).toBeNull();
    const sol = solicitudesPortal(
      [
        { id: "a", prospecto_id: "9", texto: "cambio", foto: "9/x.webp", creado: "2026-11-01" },
        { id: "b", prospecto_id: "1", texto: "ajeno", foto: null, creado: "2026-11-02" },
      ],
      "9"
    );
    expect(sol).toEqual([{ id: "a", texto: "cambio", creado: "2026-11-01", conFoto: true }]);
  });
  it("repo local: listarSolicitudes filtra por prospecto y contarEnvios no registra", async () => {
    await importarProspectos(localRepo, [{ id: "9", nombre: "C" }, { id: "1", nombre: "D" }]);
    await localRepo.crearSolicitudCambio({ prospecto_id: "9", texto: "uno", foto: null });
    await localRepo.crearSolicitudCambio({ prospecto_id: "1", texto: "ajeno", foto: null });
    expect((await localRepo.listarSolicitudes("9")).map((x) => x.texto)).toEqual(["uno"]);
    const desde = new Date(Date.now() - 3600_000).toISOString();
    expect(await localRepo.contarEnvios("k", desde)).toBe(0);
    await localRepo.registrarEnvio("k", desde);
    await localRepo.registrarEnvio("k", desde);
    expect(await localRepo.contarEnvios("k", desde)).toBe(2);
    expect(await localRepo.contarEnvios("k", desde)).toBe(2);
  });
});

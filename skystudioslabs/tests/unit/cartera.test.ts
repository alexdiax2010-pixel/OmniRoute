import { describe, it, expect } from "vitest";
import { rellenarPlantilla, numeroWhatsApp, PLANTILLAS_INICIALES } from "@/lib/crm/plantillas";
import { agruparTareas, contarVencidas } from "@/lib/crm/tareas";
import type { Tarea } from "@/lib/types";

const p = { nombre: "Taller Coronado", giro: "Taller Mecánico", colonia: "Mirador del Sol" };

describe("plantillas de mensajes", () => {
  it("rellena las variables conocidas y respeta las desconocidas", () => {
    const t = rellenarPlantilla("Hola {negocio} ({giro}) en {colonia}. {boceto} — {mi_nombre} {otra}", p, { miNombre: "Alex", boceto: "https://x" });
    expect(t).toBe("Hola Taller Coronado (taller mecánico) en Mirador del Sol. https://x — Alex {otra}");
  });
  it("las plantillas iniciales usan solo variables válidas y no traen precios", () => {
    for (const pl of PLANTILLAS_INICIALES) {
      const vars = [...pl.cuerpo.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      expect(vars.every((v) => ["negocio", "giro", "colonia", "boceto", "mi_nombre"].includes(v))).toBe(true);
      expect(pl.cuerpo).not.toMatch(/\$\s?\d/);
    }
  });
  it("normaliza números de WhatsApp de México", () => {
    expect(numeroWhatsApp("", "(33) 3628 8465")).toBe("523336288465");
    expect(numeroWhatsApp("+52 1 33 1234 5678")).toBe("523312345678");
    expect(numeroWhatsApp("no encontrado", "123")).toBeNull();
  });
});

describe("tareas", () => {
  const base = { prospecto_id: null, hecha: false, hecha_en: null, creado: "" } as const;
  const tareas: Tarea[] = [
    { ...base, id: "1", titulo: "vieja", vence: "2026-11-01", prioridad: "media" },
    { ...base, id: "2", titulo: "hoy baja", vence: "2026-11-24", prioridad: "baja" },
    { ...base, id: "3", titulo: "hoy alta", vence: "2026-11-24", prioridad: "alta" },
    { ...base, id: "4", titulo: "luego", vence: "2026-12-01", prioridad: "media" },
    { ...base, id: "5", titulo: "sin fecha", vence: null, prioridad: "media" },
    { ...base, id: "6", titulo: "hecha", vence: "2026-11-01", prioridad: "alta", hecha: true, hecha_en: "2026-11-20T10:00:00Z" },
  ];
  it("agrupa como Cartera y ordena por prioridad", () => {
    const g = agruparTareas(tareas, "2026-11-24");
    expect(g.vencidas.map((t) => t.id)).toEqual(["1"]);
    expect(g.hoy.map((t) => t.id)).toEqual(["3", "2"]);
    expect(g.proximas.map((t) => t.id)).toEqual(["4"]);
    expect(g.sinFecha.map((t) => t.id)).toEqual(["5"]);
    expect(g.hechas.map((t) => t.id)).toEqual(["6"]);
    expect(contarVencidas(tareas, "2026-11-24")).toBe(1);
  });
});

import { describe, it, expect } from "vitest";
import { cambiarEtapa, seguimientosPendientes, estadoSeguimiento } from "@/lib/crm/reglas";
import { hoyMX, sumarDias } from "@/lib/crm/fechas";
import type { Etapa } from "@/lib/types";

// 2026-11-20 03:00 UTC = 2026-11-19 21:00 en CDMX (la fecha debe ser la de México)
const AHORA = new Date("2026-11-20T03:00:00Z");
const base = { etapa: "Nuevo" as Etapa, seguimiento: null as string | null, fechaGanado: null as string | null };

describe("fechas CDMX", () => {
  it("hoyMX usa America/Mexico_City", () => {
    expect(hoyMX(AHORA)).toBe("2026-11-19");
    expect(hoyMX(new Date("2026-11-20T18:00:00Z"))).toBe("2026-11-20");
  });
  it("sumarDias cruza meses y años", () => {
    expect(sumarDias("2026-12-30", 3)).toBe("2027-01-02");
    expect(sumarDias("2028-02-27", 3)).toBe("2028-03-01");
  });
});

describe("cambiarEtapa", () => {
  for (const e of ["Contactado", "Boceto enviado", "Negociando"] as Etapa[]) {
    it(`${e} programa seguimiento a hoy+3`, () => {
      const r = cambiarEtapa(base, e, AHORA);
      expect(r.cambios.seguimiento).toBe("2026-11-22");
      expect(r.cambios.etapa).toBe(e);
      expect(r.nota?.txt).toBe(`Etapa: Nuevo → ${e}`);
      expect(r.nota?.t).toBe(AHORA.toISOString());
    });
  }
  it("Ganado pone fechaGanado = hoy si está vacía y limpia seguimiento", () => {
    const r = cambiarEtapa({ ...base, etapa: "Negociando", seguimiento: "2026-11-30" }, "Ganado", AHORA);
    expect(r.cambios.fechaGanado).toBe("2026-11-19");
    expect(r.cambios.seguimiento).toBeNull();
  });
  it("Ganado conserva una fechaGanado existente", () => {
    const r = cambiarEtapa({ ...base, fechaGanado: "2026-01-02" }, "Ganado", AHORA);
    expect(r.cambios.fechaGanado).toBe("2026-01-02");
  });
  it("Perdido limpia seguimiento; Nuevo lo conserva", () => {
    expect(cambiarEtapa({ ...base, etapa: "Contactado", seguimiento: "2026-11-25" }, "Perdido", AHORA).cambios.seguimiento).toBeNull();
    expect(cambiarEtapa({ ...base, etapa: "Contactado", seguimiento: "2026-11-25" }, "Nuevo", AHORA).cambios.seguimiento).toBe("2026-11-25");
  });
  it("misma etapa: sin cambios ni nota", () => {
    const r = cambiarEtapa({ ...base, etapa: "Contactado", seguimiento: "2026-12-01" }, "Contactado", AHORA);
    expect(r.nota).toBeNull();
    expect(r.cambios.seguimiento).toBe("2026-12-01");
  });
});

describe("seguimientos", () => {
  const lista = [
    { id: "a", etapa: "Contactado" as Etapa, seguimiento: "2026-11-20" },
    { id: "b", etapa: "Negociando" as Etapa, seguimiento: "2026-11-10" },
    { id: "c", etapa: "Contactado" as Etapa, seguimiento: "2026-11-21" },
    { id: "d", etapa: "Ganado" as Etapa, seguimiento: "2026-11-01" },
    { id: "e", etapa: "Nuevo" as Etapa, seguimiento: null },
  ];
  it("hoy o vencidos, sin cerrados, ordenados", () => {
    expect(seguimientosPendientes(lista, "2026-11-20").map((p) => p.id)).toEqual(["b", "a"]);
  });
  it("estadoSeguimiento", () => {
    expect(estadoSeguimiento("2026-11-19", "2026-11-20")).toBe("vencido");
    expect(estadoSeguimiento("2026-11-20", "2026-11-20")).toBe("hoy");
    expect(estadoSeguimiento("2026-11-21", "2026-11-20")).toBe("futuro");
    expect(estadoSeguimiento(null, "2026-11-20")).toBe("sin");
  });
});

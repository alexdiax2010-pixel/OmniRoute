import { describe, it, expect } from "vitest";
import { conteoPorEtapa, filtrarYOrdenar, leerFiltros, opcionesConConteo } from "@/lib/crm/lista";
import type { Etapa } from "@/lib/types";

const p = (nombre: string, giro: string, categoria: string, etapa: Etapa, seguimiento: string | null = null, puntaje = 0) => ({
  nombre,
  giro,
  categoria,
  colonia: "Colonia Ficticia",
  etapa,
  puntaje,
  seguimiento,
  top10: false,
});

const lista = [
  p("Dental Uno", "Dentista", "Salud", "Nuevo", null, 90),
  p("Dental Dos", "Dentista", "Salud", "Contactado", "2026-11-20", 80),
  p("Taller Tres", "Taller mecánico", "Automotriz", "Negociando", "2026-11-23", 70),
  p("Taller Cuatro", "Taller mecánico", "Automotriz", "Ganado", "2026-11-01", 60),
  p("Barbería Cinco", "Barbería", "Belleza", "Boceto enviado", "2026-12-01", 50),
];
const HOY = "2026-11-23";

describe("filtros de la lista del CRM", () => {
  it("lee giro, categoría y pendientes de la URL (con límite de largo)", () => {
    const f = leerFiltros({ giro: "Dentista", categoria: "Salud", pendientes: "1", q: "x".repeat(300) });
    expect(f).toMatchObject({ giro: "Dentista", categoria: "Salud", pendientes: true, orden: "puntaje", dir: "desc" });
    expect(f.q).toHaveLength(100);
    expect(leerFiltros({}).pendientes).toBe(false);
  });
  it("filtra por giro y por categoría", () => {
    expect(filtrarYOrdenar(lista, leerFiltros({ giro: "Dentista" })).map((x) => x.nombre)).toEqual(["Dental Uno", "Dental Dos"]);
    expect(filtrarYOrdenar(lista, leerFiltros({ categoria: "Automotriz" })).map((x) => x.nombre)).toEqual(["Taller Tres", "Taller Cuatro"]);
  });
  it("pendientes: hoy o vencidos, sin cerrados", () => {
    expect(filtrarYOrdenar(lista, leerFiltros({ pendientes: "1", orden: "seguimiento" }), HOY).map((x) => x.nombre)).toEqual(["Dental Dos", "Taller Tres"]);
  });
  it("opciones con conteo, de más a menos frecuente", () => {
    expect(opcionesConConteo(lista, (x) => x.giro)).toEqual([
      { valor: "Dentista", n: 2 },
      { valor: "Taller mecánico", n: 2 },
      { valor: "Barbería", n: 1 },
    ]);
    expect(opcionesConConteo([p("A", "", "", "Nuevo")], (x) => x.giro)).toEqual([]);
  });
  it("conteo por etapa incluye etapas vacías", () => {
    expect(conteoPorEtapa(lista)).toEqual({ Nuevo: 1, Contactado: 1, "Boceto enviado": 1, Negociando: 1, Ganado: 1, Perdido: 0 });
  });
});

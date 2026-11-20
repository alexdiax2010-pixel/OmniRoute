import { describe, it, expect } from "vitest";
import { calcularMetricas, formatoTasa, proximoCobro, serviciosPorOfrecer } from "@/lib/crm/metricas";
import { aCSV, celdaCSV } from "@/lib/crm/csv";
import type { Etapa } from "@/lib/types";

const p = (etapa: Etapa, monto: number | null, mensualidad: number | null = null, fechaGanado: string | null = null) => ({ etapa, monto, mensualidad, fechaGanado });

describe("calcularMetricas", () => {
  const lista = [
    p("Ganado", 5000, 400, "2026-11-03"),
    p("Ganado", 3000, 300, "2026-10-28"),
    p("Ganado", null, null, "2026-11-10"),
    p("Negociando", 4500),
    p("Negociando", null),
    p("Perdido", 9999),
    p("Nuevo", 1000),
  ];
  const m = calcularMetricas(lista, "2026-11-20");
  it("vendido este mes = Ganado con fechaGanado en el mes", () => expect(m.vendidoMes).toBe(5000));
  it("recurrente = suma de mensualidades Ganado", () => expect(m.recurrenteMensual).toBe(700));
  it("negociación (monto null = 0)", () => expect(m.enNegociacion).toBe(4500));
  it("tasa de cierre", () => {
    expect(m.tasaCierre).toBeCloseTo(3 / 4);
    expect(formatoTasa(m.tasaCierre)).toBe("75%");
  });
  it("sin cerrados → —", () => {
    const v = calcularMetricas([p("Nuevo", 1)], "2026-11-20");
    expect(v.tasaCierre).toBeNull();
    expect(formatoTasa(v.tasaCierre)).toBe("—");
  });
});

describe("proximoCobro", () => {
  it("este mes si aún no pasa (incluye hoy)", () => {
    expect(proximoCobro(25, "2026-11-20")).toBe("2026-11-25");
    expect(proximoCobro(20, "2026-11-20")).toBe("2026-11-20");
  });
  it("mes siguiente si ya pasó, con cambio de año", () => {
    expect(proximoCobro(5, "2026-12-20")).toBe("2027-01-05");
  });
  it("ajusta al último día del mes", () => {
    expect(proximoCobro(31, "2026-11-20")).toBe("2026-11-30");
    expect(proximoCobro(31, "2027-01-31")).toBe("2027-01-31");
    expect(proximoCobro(30, "2027-01-31")).toBe("2027-02-28");
    expect(proximoCobro(31, "2028-02-01")).toBe("2028-02-29");
  });
  it("inválido → null", () => {
    expect(proximoCobro(null, "2026-11-20")).toBeNull();
    expect(proximoCobro(0, "2026-11-20")).toBeNull();
    expect(proximoCobro(32, "2026-11-20")).toBeNull();
  });
});

describe("serviciosPorOfrecer", () => {
  it("nombres de los no contratados", () => {
    expect(serviciosPorOfrecer(["web", "maps"])).toEqual(["Redes sociales", "Chatbot", "Menú QR"]);
    expect(serviciosPorOfrecer(["web", "maps", "redes", "chatbot", "menuqr"])).toEqual([]);
  });
});

describe("CSV", () => {
  it("previene inyección de fórmulas", () => {
    expect(celdaCSV("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(celdaCSV("+52")).toBe("'+52");
    expect(celdaCSV("-1")).toBe("'-1");
    expect(celdaCSV("@SUM")).toBe("'@SUM");
  });
  it("escapa comillas, comas y saltos", () => {
    expect(celdaCSV('a "b", c')).toBe('"a ""b"", c"');
    expect(celdaCSV("x\ny")).toBe('"x\ny"');
    expect(celdaCSV(null)).toBe("");
    expect(celdaCSV(["web", "maps"])).toBe("web; maps");
  });
  it("aCSV con BOM y CRLF", () => {
    expect(aCSV(["a", "b"], [[1, "=x"]])).toBe("﻿a,b\r\n1,'=x\r\n");
  });
});

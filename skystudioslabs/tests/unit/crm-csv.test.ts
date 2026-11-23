import { describe, it, expect } from "vitest";
import { aCSV, celdaCSV } from "@/lib/crm/csv";

describe("CSV a salvo de inyección de fórmulas", () => {
  it("neutraliza = + - @ también con espacios o signos de ancho completo delante", () => {
    for (const v of [" =1+1", " =1", "  @SUM(A1)", "＝HYPERLINK(1)", "＋1", "－1", "＠x", "\tx", "\nx"]) {
      expect(celdaCSV(v).replace(/^"/, "")).toMatch(/^'/);
    }
  });
  it("no toca texto normal", () => {
    expect(celdaCSV("Taller Ficticio")).toBe("Taller Ficticio");
    expect(celdaCSV("a=b")).toBe("a=b");
    expect(celdaCSV(42)).toBe("42");
    expect(celdaCSV(null)).toBe("");
    expect(celdaCSV(["a", "b"])).toBe("a; b");
  });
  it("una celda maliciosa no rompe columnas", () => {
    const csv = aCSV(["nombre", "nota"], [['=cmd|"/c calc"!A1', "ok"]]);
    expect(csv.split("\r\n")[1]).toBe(`"'=cmd|""/c calc""!A1",ok`);
  });
});

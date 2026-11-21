import { describe, expect, it } from "vitest";
import { redireccionRelativa } from "@/lib/redireccion";

describe("redireccionRelativa", () => {
  it("usa Location relativa (se resuelve en el host actual: admin., portal. o raíz)", () => {
    const r = redireccionRelativa("/admin");
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("/admin");
  });

  it("conserva la query y acepta otro status", () => {
    const r = redireccionRelativa("/portal/login?error=enlace", 307);
    expect(r.status).toBe(307);
    expect(r.headers.get("location")).toBe("/portal/login?error=enlace");
  });

  it("nunca redirige fuera del sitio", () => {
    for (const malo of ["//evil.test/x", "https://evil.test", "/\\evil.test", "admin"]) {
      expect(redireccionRelativa(malo).headers.get("location")).toBe("/");
    }
  });
});

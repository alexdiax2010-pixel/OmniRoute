import { describe, it, expect } from "vitest";
import { firmarToken, verificarToken, esEmailAdmin, siguienteSeguro, DURACION_ENLACE_MS } from "@/lib/auth-token";

const SECRETO = "secreto-de-prueba-0123456789";
const T0 = 1_800_000_000_000;

describe("firmarToken / verificarToken", () => {
  it("firma y verifica", () => {
    const t = firmarToken({ k: "enlace", e: "Admin@Sky.Test", r: "admin" }, SECRETO, DURACION_ENLACE_MS, T0);
    const p = verificarToken(t, SECRETO, "enlace", T0 + 1000);
    expect(p?.e).toBe("admin@sky.test");
    expect(p?.r).toBe("admin");
  });
  it("expira a los 15 minutos", () => {
    const t = firmarToken({ k: "enlace", e: "a@b.mx", r: "admin" }, SECRETO, DURACION_ENLACE_MS, T0);
    expect(verificarToken(t, SECRETO, "enlace", T0 + DURACION_ENLACE_MS - 1)).not.toBeNull();
    expect(verificarToken(t, SECRETO, "enlace", T0 + DURACION_ENLACE_MS)).toBeNull();
  });
  it("rechaza manipulación del payload o firma", () => {
    const t = firmarToken({ k: "enlace", e: "a@b.mx", r: "cliente", p: "1" }, SECRETO, DURACION_ENLACE_MS, T0);
    const [cuerpo, firma] = t.split(".");
    const otro = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(cuerpo, "base64url").toString()), r: "admin" })).toString("base64url");
    expect(verificarToken(`${otro}.${firma}`, SECRETO, "enlace", T0)).toBeNull();
    expect(verificarToken(`${cuerpo}.${firma.slice(0, -2)}xx`, SECRETO, "enlace", T0)).toBeNull();
    expect(verificarToken(t, "otro-secreto-cualquiera", "enlace", T0)).toBeNull();
    expect(verificarToken("basura", SECRETO, "enlace", T0)).toBeNull();
    expect(verificarToken("", SECRETO, "enlace", T0)).toBeNull();
  });
  it("un enlace no sirve como sesión", () => {
    const t = firmarToken({ k: "enlace", e: "a@b.mx", r: "admin" }, SECRETO, DURACION_ENLACE_MS, T0);
    expect(verificarToken(t, SECRETO, "sesion", T0)).toBeNull();
  });
  it("cliente sin prospectoId es inválido", () => {
    const t = firmarToken({ k: "sesion", e: "a@b.mx", r: "cliente" }, SECRETO, DURACION_ENLACE_MS, T0);
    expect(verificarToken(t, SECRETO, "sesion", T0)).toBeNull();
  });
});

describe("esEmailAdmin", () => {
  it("lista separada por comas, sin mayúsculas", () => {
    expect(esEmailAdmin("ADMIN@sky.test", " admin@sky.test , otro@x.mx")).toBe(true);
    expect(esEmailAdmin("nadie@sky.test", "admin@sky.test")).toBe(false);
    expect(esEmailAdmin("admin@sky.test", undefined)).toBe(false);
    expect(esEmailAdmin("", "")).toBe(false);
  });
});

describe("siguienteSeguro", () => {
  it("solo rutas internas de admin/portal", () => {
    expect(siguienteSeguro("/admin/prospectos/1", "/admin")).toBe("/admin/prospectos/1");
    expect(siguienteSeguro("/portal", "/admin")).toBe("/portal");
    expect(siguienteSeguro("https://malo.com", "/admin")).toBe("/admin");
    expect(siguienteSeguro("//malo.com", "/admin")).toBe("/admin");
    expect(siguienteSeguro("/administrador", "/admin")).toBe("/admin");
    expect(siguienteSeguro("/admin/login", "/admin")).toBe("/admin");
  });
});

import { describe, it, expect } from "vitest";
import { codigoCorrecto } from "@/lib/auth-codigo";
import { avisoNuevoCliente, pushConfigurado } from "@/lib/push";

const SECRETO = "secreto-de-prueba-largo-123";

describe("acceso al CRM con código especial", () => {
  it("acepta solo el código exacto (ignora espacios al inicio/fin)", () => {
    expect(codigoCorrecto("Brasa-2026-Zapopan", "Brasa-2026-Zapopan", SECRETO)).toBe(true);
    expect(codigoCorrecto("  Brasa-2026-Zapopan ", "Brasa-2026-Zapopan", SECRETO)).toBe(true);
    expect(codigoCorrecto("brasa-2026-zapopan", "Brasa-2026-Zapopan", SECRETO)).toBe(false);
    expect(codigoCorrecto("", "Brasa-2026-Zapopan", SECRETO)).toBe(false);
  });
  it("rechaza todo si el código configurado es corto o no existe", () => {
    expect(codigoCorrecto("1234567", "1234567", SECRETO)).toBe(false);
    expect(codigoCorrecto("cualquiera", "", SECRETO)).toBe(false);
  });
});

describe("aviso push de cliente nuevo", () => {
  it("arma título y cuerpo con el negocio y abre el CRM", () => {
    const a = avisoNuevoCliente({ nombre: "Ana", negocio: "Taller Ana", origen: "home" });
    expect(a.titulo).toBe("Nuevo cliente: Taller Ana");
    expect(a.cuerpo).toContain("Ana");
    expect(a.url).toBe("/admin");
  });
  it("solo se activa con ambas llaves VAPID", () => {
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; delete process.env.VAPID_PRIVATE_KEY;
    expect(pushConfigurado()).toBe(false);
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "pub"; process.env.VAPID_PRIVATE_KEY = "priv";
    expect(pushConfigurado()).toBe(true);
    if (pub === undefined) delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; else process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = pub;
    if (priv === undefined) delete process.env.VAPID_PRIVATE_KEY; else process.env.VAPID_PRIVATE_KEY = priv;
  });
});

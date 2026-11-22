import { describe, it, expect, afterEach } from "vitest";
import { codigoCorrecto } from "@/lib/auth-codigo";
import { avisoConfigurado, mensajeAviso, urlAviso } from "@/lib/notificar";

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

describe("aviso de prospecto nuevo por WhatsApp (CallMeBot)", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });
  const lead = { nombre: "Ana", negocio: "Taller Ana", whatsapp: "3312345678", origen: "home" };

  it("solo se activa con llave y número válidos", () => {
    delete process.env.CALLMEBOT_APIKEY;
    process.env.AVISO_WHATSAPP = "524492889487";
    expect(avisoConfigurado()).toBe(false);
    process.env.CALLMEBOT_APIKEY = "123456";
    expect(avisoConfigurado()).toBe(true);
    process.env.AVISO_WHATSAPP = "449 288 9487";
    expect(avisoConfigurado()).toBe(false);
  });
  it("arma el mensaje y la URL con el texto codificado", () => {
    const m = mensajeAviso(lead, "https://skystudioslabs.com/");
    expect(m).toContain("Negocio: Taller Ana");
    expect(m).toContain("https://skystudioslabs.com/admin");
    const u = new URL(urlAviso(m, { CALLMEBOT_APIKEY: "k1", AVISO_WHATSAPP: "524492889487" } as unknown as NodeJS.ProcessEnv));
    expect(u.origin + u.pathname).toBe("https://api.callmebot.com/whatsapp.php");
    expect(u.searchParams.get("phone")).toBe("+524492889487");
    expect(u.searchParams.get("apikey")).toBe("k1");
    expect(u.searchParams.get("text")).toBe(m);
  });
});

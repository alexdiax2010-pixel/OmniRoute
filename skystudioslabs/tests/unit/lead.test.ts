import { describe, it, expect } from "vitest";
import { esquemaLead, esSpam, evaluarLead, normalizarWhatsAppMX, prospectoDesdeLead, hashIp } from "@/lib/lead";
import { validarFoto, tipoPorFirma } from "@/lib/portal/imagen";

const valido = { nombre: "Ana", negocio: "Taller Ejemplo", whatsapp: "33 0000 0001", origen: "home" };

describe("normalizarWhatsAppMX", () => {
  it("acepta 10 dígitos con o sin +52/521", () => {
    expect(normalizarWhatsAppMX("3300000001")).toBe("3300000001");
    expect(normalizarWhatsAppMX("+52 33 0000 0001")).toBe("3300000001");
    expect(normalizarWhatsAppMX("521 3300000001")).toBe("3300000001");
  });
  it("rechaza otras longitudes", () => {
    expect(normalizarWhatsAppMX("12345")).toBeNull();
    expect(normalizarWhatsAppMX("330000000123")).toBeNull();
  });
});

describe("esquemaLead", () => {
  it("valida y limpia", () => {
    const r = esquemaLead.parse({ ...valido, nombre: "  Ana   López ", origen: "seo:taller<script>" });
    expect(r.nombre).toBe("Ana López");
    expect(r.whatsapp).toBe("3300000001");
    expect(r.origen).toBe("seo:tallerscript");
  });
  it("origen por defecto", () => expect(esquemaLead.parse({ ...valido, origen: undefined }).origen).toBe("sitio"));
  it("rechaza campos faltantes o inválidos", () => {
    const r = evaluarLead({ nombre: "A", negocio: "", whatsapp: "123" });
    expect(r.tipo).toBe("invalido");
    if (r.tipo === "invalido") expect(Object.keys(r.campos).sort()).toEqual(["negocio", "nombre", "whatsapp"]);
  });
  it("rechaza textos larguísimos", () => {
    expect(esquemaLead.safeParse({ ...valido, negocio: "x".repeat(500) }).success).toBe(false);
  });
});

describe("honeypot", () => {
  it("sitio_web lleno = spam (aunque lo demás sea válido)", () => {
    expect(esSpam({ ...valido, sitio_web: "http://spam" })).toBe(true);
    expect(evaluarLead({ ...valido, sitio_web: "x" }).tipo).toBe("spam");
  });
  it("vacío o ausente = persona", () => {
    expect(esSpam({ ...valido, sitio_web: "" })).toBe(false);
    expect(esSpam(valido)).toBe(false);
    expect(evaluarLead(valido).tipo).toBe("ok");
  });
});

describe("prospectoDesdeLead", () => {
  it("mapea al prospecto con nota del formulario", () => {
    const lead = esquemaLead.parse(valido);
    const p = prospectoDesdeLead(lead, new Date("2026-11-20T10:00:00Z"));
    expect(p).toMatchObject({ nombre: "Taller Ejemplo", giro: "", whatsapp: "3300000001", fuente: "web", etapa: "Nuevo" });
    expect(p.notas).toEqual([{ t: "2026-11-20T10:00:00.000Z", txt: "Formulario web (home): contacto Ana" }]);
  });
  it("hashIp es estable y depende del secreto", () => {
    expect(hashIp("1.2.3.4", "a")).toBe(hashIp("1.2.3.4", "a"));
    expect(hashIp("1.2.3.4", "a")).not.toBe(hashIp("1.2.3.4", "b"));
    expect(hashIp("1.2.3.4", "a")).not.toContain("1.2.3.4");
  });
});

describe("fotos del portal", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0]);
  const webp = new Uint8Array([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")]);
  it("detecta por magic bytes", () => {
    expect(tipoPorFirma(png)).toBe("image/png");
    expect(tipoPorFirma(jpg)).toBe("image/jpeg");
    expect(tipoPorFirma(webp)).toBe("image/webp");
    expect(tipoPorFirma(Buffer.from("<svg>"))).toBeNull();
  });
  it("valida tipo declarado, firma y tamaño", () => {
    expect(validarFoto(png, "image/png").ok).toBe(true);
    expect(validarFoto(png, "image/jpeg").ok).toBe(false);
    expect(validarFoto(Buffer.from("<svg></svg>"), "image/png").ok).toBe(false);
    expect(validarFoto(png, "image/gif").ok).toBe(false);
    const grande = new Uint8Array(300 * 1024 + 1);
    grande.set(png);
    expect(validarFoto(grande, "image/png").ok).toBe(false);
  });
});

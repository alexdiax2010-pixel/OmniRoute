import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { evaluarLead, normalizarWhatsAppMX } from "@/lib/lead";
import { CAMPOS_LEAD, resultadoSinJs, validarLead, whatsappValido } from "@/components/forms/validacion";

const CASOS_WA = ["3312345678", "33 1234 5678", "+52 33 1234 5678", "+52 1 33 1234 5678", "521 3312345678", "12345", "", "33-12-34-56-78-9", "abc"];

describe("validación del formulario (espejo de lib/lead.ts)", () => {
  it.each(CASOS_WA)("WhatsApp %j: el navegador y el servidor opinan igual", (v) => {
    expect(whatsappValido(v)).toBe(normalizarWhatsAppMX(v) !== null);
  });

  const DATOS: Record<string, unknown>[] = [
    { nombre: "Ana", negocio: "Taller Ana", whatsapp: "33 1234 5678" },
    { nombre: "A", negocio: "Taller", whatsapp: "3312345678" },
    { nombre: "  ", negocio: " ", whatsapp: "" },
    { nombre: "Luis", negocio: "x".repeat(121), whatsapp: "+52 1 33 1234 5678" },
    { nombre: "y".repeat(81), negocio: "Fonda", whatsapp: "123" },
    {},
  ];

  it.each(DATOS.map((d, i) => [i, d] as const))("caso %i: mismos campos con error y mismos mensajes", (_i, d) => {
    const cliente = validarLead(d);
    const servidor = evaluarLead(d);
    const camposServidor = servidor.tipo === "invalido" ? servidor.campos : {};
    expect(Object.keys(cliente).sort()).toEqual(Object.keys(camposServidor).sort());
    for (const k of Object.keys(cliente)) expect(cliente[k as keyof typeof cliente]).toBe(camposServidor[k]);
  });

  it("lee el resultado que deja el envío sin JavaScript", () => {
    expect(resultadoSinJs("?lead=ok")).toBe("ok");
    expect(resultadoSinJs("?x=1&lead=error")).toBe("error");
    expect(resultadoSinJs("?lead=otra")).toBeNull();
    expect(resultadoSinJs("")).toBeNull();
  });
});

describe("LeadForm conserva su contrato con /api/prospectos", () => {
  const src = readFileSync("components/forms/LeadForm.tsx", "utf8");
  it("envía los mismos campos al mismo endpoint", () => {
    expect(src).toContain('action="/api/prospectos"');
    expect(src).toContain('fetch("/api/prospectos"');
    for (const c of CAMPOS_LEAD) expect(src).toContain(`"${c}"`);
    expect(src).toContain('name="origen"');
    expect(src).toContain('name="sitio_web"');
  });
  it("mantiene textos que usan las pruebas e2e y la accesibilidad básica", () => {
    expect(src).toContain('"Tu nombre"');
    expect(src).toContain('"Nombre de tu negocio"');
    expect(src).toContain("Quiero mi boceto gratis");
    expect(src).toContain("¡Gracias!");
    expect(src).toContain('aria-live="polite"');
    expect(src).toContain("aria-invalid");
    expect(src).toContain("aria-describedby");
  });
  it("el WhatsApp acepta +52 1 con espacios (maxLength suficiente)", () => {
    const m = src.match(/maxLength: (\d+), placeholder/);
    expect(Number(m?.[1])).toBeGreaterThanOrEqual("+52 1 33 1234 5678".length);
  });
});

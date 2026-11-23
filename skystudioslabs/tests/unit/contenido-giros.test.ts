import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { PAGINAS_GIRO, PAGINAS_SEO } from "@/lib/seo/paginas";

const NUEVAS = [
  "paginas-web-para-abogados-y-contadores",
  "paginas-web-para-consultorios",
  "paginas-web-para-veterinarias",
];

/** Todo el texto visible de una página, para revisar reglas de contenido. */
function textos(p: (typeof PAGINAS_SEO)[number]): string {
  return [
    p.titulo,
    p.descripcion,
    p.h1,
    p.antetitulo,
    p.intro,
    p.problemasTitulo,
    p.incluyeTitulo,
    p.nota ?? "",
    p.ctaTexto ?? "",
    p.mensajeWhatsApp,
    p.servicio.nombre,
    p.servicio.descripcion,
    ...p.problemas.flatMap((b) => [b.titulo, b.texto]),
    ...p.incluye.flatMap((b) => [b.titulo, b.texto]),
    ...p.faqs.flatMap((f) => [f.pregunta, f.respuesta]),
  ].join("\n");
}

describe("páginas de giro nuevas", () => {
  it.each(NUEVAS)("%s existe en paginas.ts y tiene su ruta con PlantillaSEO", (slug) => {
    const p = PAGINAS_GIRO.find((x) => x.slug === slug);
    expect(p, slug).toBeTruthy();
    const ruta = `app/(sitio)/${slug}/page.tsx`;
    expect(existsSync(ruta)).toBe(true);
    const src = readFileSync(ruta, "utf8");
    expect(src).toContain(`const SLUG = "${slug}"`);
    expect(src).toContain("metadataSEO(SLUG)");
    expect(src).toContain("<PlantillaSEO slug={SLUG} />");
  });
});

describe("contenido de las páginas de giro", () => {
  it.each(PAGINAS_GIRO.map((p) => [p.slug, p] as const))("%s: título, descripción, FAQ y CTA de boceto", (_slug, p) => {
    expect(p.titulo).toMatch(/en México$/);
    expect(p.descripcion.length).toBeGreaterThan(80);
    expect(p.descripcion.length).toBeLessThanOrEqual(170);
    expect(p.h1).toMatch(/\*[^*]+\*/);
    expect(p.problemas).toHaveLength(4);
    expect(p.incluye.length).toBeGreaterThanOrEqual(6);
    expect(p.faqs.length).toBeGreaterThanOrEqual(6);
    const preguntas = p.faqs.map((f) => f.pregunta);
    expect(preguntas).toContain("¿El boceto gratis me compromete a algo?");
    expect(preguntas).toContain("¿Cuánto cuesta?");
    expect(new Set(preguntas).size).toBe(preguntas.length);
    // CTA: el mensaje de WhatsApp y el texto de cierre piden el boceto gratis.
    expect(p.mensajeWhatsApp).toMatch(/boceto gratis/i);
    expect(p.ctaTexto).toMatch(/WhatsApp/);
    expect(p.ctaTexto).toMatch(/antes de que pagues nada/);
  });

  it("cada página de giro usa una maqueta de ejemplo distinta", () => {
    const ejemplos = PAGINAS_GIRO.map((p) => p.ejemplo);
    expect(new Set(ejemplos).size).toBe(ejemplos.length);
  });

  it("los menús son cortos y los h1 no traen palabras largas que rompan en celular", () => {
    for (const p of PAGINAS_GIRO) {
      expect(p.menu.length, p.slug).toBeLessThanOrEqual(28);
      for (const palabra of p.h1.replace(/\*/g, "").split(/\s+/)) expect(palabra.length, p.slug).toBeLessThanOrEqual(12);
    }
  });
});

describe("reglas de contenido (sin datos inventados)", () => {
  it.each(PAGINAS_SEO.map((p) => [p.slug, p] as const))("%s no trae precios, cifras de resultados ni testimonios", (_slug, p) => {
    const t = textos(p);
    // Precios: nada de "$" ni montos en pesos; los precios viven en config/precios.ts.
    expect(t).not.toMatch(/\$\s?\d/);
    expect(t).not.toMatch(/\d[\d,.]*\s?(pesos|MXN|mil)\b/i);
    // Porcentajes y "X clientes/negocios".
    expect(t).not.toMatch(/\d+\s?%/);
    expect(t).not.toMatch(/\d+\s+(clientes|negocios|pacientes|empresas)\b/i);
    expect(t).not.toMatch(/conf[ií]an en nosotros|nuestros clientes dicen|testimonio/i);
    // Promesas que no podemos cumplir.
    expect(t).not.toMatch(/garantizamos|primer lugar garantizado/i);
  });

  it("las páginas no se limitan a Zapopan/Guadalajara (atendemos todo México)", () => {
    for (const p of PAGINAS_SEO) expect(textos(p), p.slug).not.toMatch(/Zapopan|Guadalajara|Jalisco/);
    for (const p of PAGINAS_GIRO) expect(p.descripcion + p.servicio.descripcion).toMatch(/todo México/);
  });
});

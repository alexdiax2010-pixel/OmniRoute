import { describe, it, expect } from "vitest";
import { PAGINAS_SEO, RUTAS_SEO } from "@/lib/seo/paginas";
import { metadataSEO, schemasPagina } from "@/lib/seo/metadata";
import { construirSitemap, construirRobots, RUTAS_PRIVADAS } from "@/lib/seo/sitemap";
import { faqPage, professionalService, serializarJsonLd } from "@/lib/seo/schema";
import type { Sitio } from "@/lib/types";

const SITE = "https://skystudioslabs.com";
const ROOT = "skystudioslabs.com";

const sitio = (p: Partial<Sitio> & Pick<Sitio, "slug" | "tipo">): Sitio => ({
  prospecto_id: null,
  carpeta: p.slug,
  dominio_propio: null,
  activo: true,
  expira: null,
  creado: "2026-01-01T00:00:00.000Z",
  ...p,
});

const SITIOS: Sitio[] = [
  sitio({ slug: "taller-ramirez", tipo: "cliente" }),
  sitio({ slug: "barberia-inactiva", tipo: "cliente", activo: false }),
  sitio({ slug: "propuesta-dental", tipo: "propuesta", expira: "2027-01-01" }),
];

describe("páginas SEO", () => {
  it("son 8 con slugs únicos (4 servicios + 4 giros)", () => {
    expect(PAGINAS_SEO).toHaveLength(8);
    expect(new Set(PAGINAS_SEO.map((p) => p.slug)).size).toBe(8);
    expect(PAGINAS_SEO.filter((p) => p.tipo === "servicio")).toHaveLength(4);
    expect(PAGINAS_SEO.filter((p) => p.tipo === "giro")).toHaveLength(4);
  });

  it.each(PAGINAS_SEO.map((p) => [p.slug, p] as const))("%s tiene title, description, canonical y schema", (slug, p) => {
    expect(p.titulo.length).toBeGreaterThan(10);
    expect(p.descripcion.length).toBeGreaterThan(80);
    expect(p.descripcion.length).toBeLessThanOrEqual(170);
    const meta = metadataSEO(slug);
    expect(meta.title).toBe(p.titulo);
    expect(meta.description).toBe(p.descripcion);
    expect(meta.alternates?.canonical).toBe(`/${slug}`);
    expect(meta.openGraph).toBeTruthy();
    const schemas = schemasPagina(p, SITE);
    const tipos = schemas.map((s) => s["@type"]);
    expect(tipos).toEqual(expect.arrayContaining(["Service", "FAQPage", "BreadcrumbList"]));
    expect(p.faqs.length).toBeGreaterThanOrEqual(4);
  });

  it("las páginas de giro responden las 4 preguntas base", () => {
    for (const p of PAGINAS_SEO.filter((x) => x.tipo === "giro")) {
      const preguntas = p.faqs.map((f) => f.pregunta);
      expect(preguntas).toEqual(
        expect.arrayContaining(["¿Cuánto tarda?", "¿Qué necesito darte?", "¿Incluye dominio?", "¿Puedo hacer cambios?"])
      );
      const dominio = p.faqs.find((f) => f.pregunta === "¿Incluye dominio?")!;
      expect(dominio.respuesta).toContain("skystudioslabs.com");
    }
  });

  it("los títulos y descripciones no se repiten", () => {
    expect(new Set(PAGINAS_SEO.map((p) => p.titulo)).size).toBe(8);
    expect(new Set(PAGINAS_SEO.map((p) => p.descripcion)).size).toBe(8);
  });
});

describe("schema.org", () => {
  it("ProfessionalService cubre todo México con teléfono de llamadas y WhatsApp de ventas", () => {
    const ps = professionalService(SITE);
    expect(ps["@type"]).toBe("ProfessionalService");
    expect(ps.areaServed).toEqual({ "@type": "Country", name: "México" });
    expect(JSON.stringify(ps)).not.toMatch(/Zapopan|Guadalajara|Jalisco/);
    expect(ps.sameAs).toEqual(["https://www.instagram.com/sky_studiolabs"]);
    expect(ps.telephone).toBe("+523330282202");
    expect(JSON.stringify(ps.contactPoint)).toContain("+524492889487");
    expect(JSON.stringify(ps.contactPoint)).toContain("+523330282202");
  });
  it("FAQPage y serialización segura", () => {
    const f = faqPage([{ pregunta: "¿<script>?", respuesta: "</script>" }]);
    expect(f["@type"]).toBe("FAQPage");
    expect(serializarJsonLd(f)).not.toContain("<");
  });
});

describe("sitemap", () => {
  const mapa = construirSitemap(SITIOS, SITE, ROOT);
  const urls = mapa.map((e) => e.url);

  it("incluye el inicio y las 8 páginas SEO", () => {
    expect(urls).toContain(`${SITE}/`);
    for (const ruta of RUTAS_SEO) expect(urls).toContain(`${SITE}${ruta}`);
  });
  it("incluye sólo sitios de cliente activos", () => {
    expect(urls).toContain("https://taller-ramirez.skystudioslabs.com/");
    expect(urls.some((u) => u.includes("barberia-inactiva"))).toBe(false);
    expect(urls.some((u) => u.includes("propuesta"))).toBe(false);
  });
  it("excluye admin, portal, propuestas y duplicados /c/", () => {
    for (const u of urls) {
      expect(u).not.toMatch(/\/(admin|portal|propuestas|sitios|api)(\/|$)/);
      expect(u).not.toMatch(/\/\/(admin|portal|propuesta)\./);
      expect(u).not.toContain("/c/");
    }
  });
  it("usa http en localhost", () => {
    const local = construirSitemap(SITIOS, "http://localhost:3000", "localhost:3000").map((e) => e.url);
    expect(local).toContain("http://taller-ramirez.localhost:3000/");
  });
});

describe("robots", () => {
  it("el dominio principal bloquea admin, portal y propuestas", () => {
    const r = construirRobots("skystudioslabs.com", ROOT, SITE);
    const regla = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(regla.allow).toBe("/");
    for (const ruta of ["/admin", "/portal", "/propuestas", "/api", "/sitios"]) {
      expect(regla.disallow).toContain(ruta);
      expect(RUTAS_PRIVADAS).toContain(ruta);
    }
    expect(r.sitemap).toBe(`${SITE}/sitemap.xml`);
  });
  it.each(["propuesta", "admin", "portal"])("%s. bloquea todo", (sub) => {
    const r = construirRobots(`${sub}.skystudioslabs.com`, ROOT, SITE);
    const regla = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(regla.disallow).toBe("/");
    expect(regla.allow).toBeUndefined();
  });
});

describe("contacto", () => {
  it("WhatsApp al 449 y teléfono de llamadas al 33", async () => {
    const { linkWhatsApp, formatoTelefono, SITIO } = await import("@/config/sitio");
    expect(linkWhatsApp("hola")).toBe("https://wa.me/524492889487?text=hola");
    expect(formatoTelefono(SITIO.telefono)).toBe("+52 33 3028 2202");
    expect(formatoTelefono(SITIO.whatsapp)).toBe("+52 44 9288 9487");
  });
});

describe("sitemap usa solo sitios públicos", () => {
  it("app/sitemap.ts lee listarSitiosPublicos (con service role), no listarSitios (requiere sesión)", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("app/sitemap.ts", "utf8");
    expect(src).toContain("listarSitiosPublicos()");
    expect(src).not.toMatch(/listarSitios\(\)/);
  });
});

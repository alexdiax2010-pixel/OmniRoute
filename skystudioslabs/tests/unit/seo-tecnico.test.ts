import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { metadataSEO } from "@/lib/seo/metadata";
import { construirRobots, construirSitemap, RUTAS_PRIVADAS } from "@/lib/seo/sitemap";
import { esMarcador, perfilesSociales, professionalService, webSite } from "@/lib/seo/schema";
import { cabecerasSeguridad, construirCsp, esPaginaPropia, hostSinWww, robotsPorHost } from "@/lib/seo/cabeceras";
import { resolverHost, rutaReescrita } from "@/lib/hosts";
import type { Sitio } from "@/lib/types";

const SITE = "https://skystudioslabs.com";
const ROOT = "skystudioslabs.com";
const regla = (r: ReturnType<typeof construirRobots>) => (Array.isArray(r.rules) ? r.rules[0] : r.rules);

describe("schema.org sin datos inventados", () => {
  const ps = professionalService(SITE);
  const json = JSON.stringify(ps);
  it("no trae reseñas, calificaciones, precios ni dirección inventada", () => {
    expect(json).not.toMatch(/aggregateRating|AggregateRating|"review"|priceRange|streetAddress|geo/);
  });
  it("omite marcadores sin llenar (correo y Facebook)", () => {
    expect(esMarcador("[MI_CORREO]")).toBe(true);
    expect(esMarcador("")).toBe(true);
    expect(esMarcador("sky_studiolabs")).toBe(false);
    expect(json).not.toMatch(/\[MI_/);
    expect(ps.email).toBeUndefined();
    expect(perfilesSociales()).toEqual(["https://www.instagram.com/sky_studiolabs"]);
  });
  it("los dos números aparecen como ContactPoint con +52", () => {
    const cps = ps.contactPoint as { telephone: string }[];
    expect(cps.map((c) => c.telephone).sort()).toEqual(["+523330282202", "+524492889487"]);
  });
  it("WebSite enlaza al negocio por @id", () => {
    const w = webSite(SITE);
    expect(w["@type"]).toBe("WebSite");
    expect(w.url).toBe(`${SITE}/`);
    expect(w.publisher).toEqual({ "@id": ps["@id"] });
  });
});

describe("Open Graph / Twitter", () => {
  it("cada página SEO trae tarjeta summary_large_image con imagen", () => {
    const m = metadataSEO("paginas-web-para-dentistas");
    const tw = m.twitter as { card: string; images: string[]; title: string };
    expect(tw.card).toBe("summary_large_image");
    expect(tw.images[0]).toBe("/opengraph-image");
    expect(tw.title).toContain("Sky Studios Labs");
  });
  it("el layout raíz usa siteUrl() y define OG/Twitter por defecto", () => {
    const src = readFileSync("app/layout.tsx", "utf8");
    expect(src).toContain("metadataBase: new URL(siteUrl())");
    expect(src).toMatch(/openGraph:/);
    expect(src).toMatch(/twitter:/);
  });
});

describe("sitemap y robots coherentes", () => {
  const sitios: Sitio[] = [
    { slug: "taller-demo", tipo: "cliente", activo: true, carpeta: "x", dominio_propio: null, expira: null, prospecto_id: null, creado: "2026-03-01T00:00:00.000Z" },
  ];
  it("sin lastModified falso en páginas propias; los clientes usan su fecha de alta", () => {
    const mapa = construirSitemap(sitios, SITE, ROOT);
    expect(mapa.find((e) => e.url === `${SITE}/`)?.lastModified).toBeUndefined();
    expect(mapa.find((e) => e.url.includes("taller-demo"))?.lastModified).toEqual(new Date("2026-03-01T00:00:00.000Z"));
  });
  it("/c/ se puede rastrear (su noindex debe verse) y /auth/ no", () => {
    expect(RUTAS_PRIVADAS).not.toContain("/c/");
    expect(regla(construirRobots(ROOT, ROOT, SITE)).disallow).toContain("/auth/");
  });
  it("propuesta. permite rastrear para que Google vea el noindex", () => {
    const r = construirRobots(`propuesta.${ROOT}`, ROOT, SITE);
    expect(regla(r).allow).toBe("/");
    expect(regla(r).disallow).toBeUndefined();
    expect(r.sitemap).toBeUndefined();
  });
  it("cliente y dominio propio: todo permitido; sitemap sólo en subdominio", () => {
    expect(construirRobots(`taller-demo.${ROOT}`, ROOT, SITE).sitemap).toBe(`${SITE}/sitemap.xml`);
    const propio = construirRobots("tallerramirez.mx", ROOT, SITE);
    expect(regla(propio).allow).toBe("/");
    expect(propio.sitemap).toBeUndefined();
  });
});

describe("cabeceras de seguridad", () => {
  it("CSP estricta en producción: sin eval, sin orígenes externos, sin marcos", () => {
    const csp = construirCsp(false);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/https?:/);
    expect(construirCsp(true)).toContain("'unsafe-eval'");
  });
  it("sólo se aplica a páginas propias, nunca a sitios de clientes ni propuestas", () => {
    const caso = (host: string, ruta: string) => {
      const d = resolverHost(host, ROOT);
      return esPaginaPropia(d, rutaReescrita(d, ruta));
    };
    expect(caso(ROOT, "/")).toBe(true);
    expect(caso(`admin.${ROOT}`, "/")).toBe(true);
    expect(caso(`portal.${ROOT}`, "/")).toBe(true);
    expect(caso(ROOT, "/c/taller-demo")).toBe(false);
    expect(caso(`taller-demo.${ROOT}`, "/")).toBe(false);
    expect(caso(`propuesta.${ROOT}`, "/boceto")).toBe(false);
    expect(caso("tallerramirez.mx", "/")).toBe(false);
    expect(Object.keys(cabecerasSeguridad())).toEqual(["Content-Security-Policy", "X-Frame-Options"]);
  });
  it("X-Robots-Tag noindex en CRM, portal, propuestas y vistas previas de Vercel", () => {
    const r = (host: string) => robotsPorHost(resolverHost(host, ROOT), host);
    expect(r(`admin.${ROOT}`)).toBe("noindex, nofollow");
    expect(r(`portal.${ROOT}`)).toBe("noindex, nofollow");
    expect(r(`propuesta.${ROOT}`)).toBe("noindex, nofollow");
    expect(r("sky-git-main.vercel.app")).toBe("noindex, nofollow");
    expect(r(ROOT)).toBeNull();
    expect(r(`taller-demo.${ROOT}`)).toBeNull();
  });
  it("www redirige al dominio raíz", () => {
    expect(hostSinWww(`www.${ROOT}`, ROOT)).toBe(ROOT);
    expect(hostSinWww("WWW.skystudioslabs.com", ROOT)).toBe(ROOT);
    expect(hostSinWww(ROOT, ROOT)).toBeNull();
    expect(hostSinWww(`taller-demo.${ROOT}`, ROOT)).toBeNull();
  });
  it("next.config.ts declara HSTS y proxy.ts usa las cabeceras", () => {
    expect(readFileSync("next.config.ts", "utf8")).toContain("Strict-Transport-Security");
    const proxy = readFileSync("proxy.ts", "utf8");
    expect(proxy).toContain("cabecerasSeguridad(");
    expect(proxy).toContain("robotsPorHost(");
  });
});

describe("logo del negocio", () => {
  it("es un PNG que existe en public/ y mide ≥112 px", async () => {
    const { existsSync } = await import("node:fs");
    const logo = String(professionalService(SITE).logo);
    expect(logo).toBe(`${SITE}/icons/icon-512.png`);
    expect(existsSync("public/icons/icon-512.png")).toBe(true);
    const png = readFileSync("public/icons/icon-512.png");
    expect(png.readUInt32BE(16)).toBeGreaterThanOrEqual(112);
  });
});

describe("favicon", () => {
  it("/favicon.ico se reescribe al icon.svg (evita 404 en el CRM y en bots)", async () => {
    const { default: config } = await import("../../next.config");
    const reglas = (await config.rewrites!()) as { source: string; destination: string; has: { value: string }[] }[];
    const r = reglas.find((x) => x.source === "/favicon.ico")!;
    expect(r.destination).toBe("/icon.svg");
    const re = new RegExp(`^${r.has[0].value}$`);
    for (const h of ["skystudioslabs.com", "www.skystudioslabs.com", "admin.skystudioslabs.com", "portal.skystudioslabs.com"]) expect(re.test(h)).toBe(true);
    for (const h of ["taller-demo.skystudioslabs.com", "propuesta.skystudioslabs.com", "tallerramirez.mx"]) expect(re.test(h)).toBe(false);
  });
});

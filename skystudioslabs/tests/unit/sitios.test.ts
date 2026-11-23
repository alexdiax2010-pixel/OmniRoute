import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  resolverRutaSegura,
  inyectarPie,
  inyectarFranja,
  inyectarNoindex,
  inyectarBase,
  inyectarCanonical,
  calcularBase,
  tipoContenido,
  estadoSitio,
  buscarArchivo,
  rutaCanonica,
  urlRaiz,
} from "@/lib/sitios/servir";
import { buscarImagenesPesadas, LIMITE_IMAGEN } from "@/lib/sitios/imagenes";
import type { Sitio } from "@/lib/types";

const BASE = path.resolve("/srv/clientes/demo");
const HTML = `<!doctype html><html><head><title>x</title></head><body><h1>Hola</h1></body></html>`;

describe("resolverRutaSegura", () => {
  it("acepta rutas normales dentro de la base", () => {
    expect(resolverRutaSegura(BASE, [])).toBe(BASE);
    expect(resolverRutaSegura(BASE, ["img", "foto.webp"])).toBe(path.join(BASE, "img", "foto.webp"));
    expect(resolverRutaSegura(BASE, ["", "index.html"])).toBe(path.join(BASE, "index.html"));
  });
  it("rechaza traversal, nulos, absolutas, separadores y dotfiles", () => {
    expect(resolverRutaSegura(BASE, [".."])).toBeNull();
    expect(resolverRutaSegura(BASE, ["img", "..", "..", "otro"])).toBeNull();
    expect(resolverRutaSegura(BASE, ["../otro"])).toBeNull();
    expect(resolverRutaSegura(BASE, ["..\\otro"])).toBeNull();
    expect(resolverRutaSegura(BASE, ["/etc/passwd"])).toBeNull();
    expect(resolverRutaSegura(BASE, ["index.html\0.png"])).toBeNull();
    expect(resolverRutaSegura(BASE, [".env"])).toBeNull();
    expect(resolverRutaSegura(BASE, [".git", "config"])).toBeNull();
    expect(resolverRutaSegura(BASE, ["C:", "Windows"])).toBeNull();
  });
});

describe("buscarArchivo", () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "sky-sitio-"));
    await mkdir(path.join(dir, "sitio", "blog"), { recursive: true });
    await writeFile(path.join(dir, "sitio", "index.html"), HTML);
    await writeFile(path.join(dir, "sitio", "menu.html"), HTML);
    await writeFile(path.join(dir, "sitio", "blog", "index.html"), HTML);
    await writeFile(path.join(dir, "secreto.txt"), "no");
    await symlink(path.join(dir, "secreto.txt"), path.join(dir, "sitio", "fuga.txt"));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });
  it("directorio → index.html y sin extensión → .html", async () => {
    const base = path.join(dir, "sitio");
    expect((await buscarArchivo(base, []))?.rel).toBe("index.html");
    expect((await buscarArchivo(base, ["blog"]))?.rel).toBe(path.join("blog", "index.html"));
    expect((await buscarArchivo(base, ["menu"]))?.rel).toBe("menu.html");
    expect(await buscarArchivo(base, ["no-existe.css"])).toBeNull();
  });
  it("no sigue enlaces simbólicos fuera de la carpeta", async () => {
    expect(await buscarArchivo(path.join(dir, "sitio"), ["fuga.txt"])).toBeNull();
    expect(await buscarArchivo(path.join(dir, "sitio"), ["..", "secreto.txt"])).toBeNull();
  });
});

describe("inyecciones HTML", () => {
  it("el pie se inyecta una sola vez, antes de </body>", () => {
    const una = inyectarPie(HTML, "skystudioslabs.com");
    const dos = inyectarPie(una, "skystudioslabs.com");
    expect(dos).toBe(una);
    expect(una.match(/Hecho por Sky Studios Labs/g)).toHaveLength(1);
    expect(una).toContain('href="https://skystudioslabs.com"');
    expect(una.indexOf("Hecho por")).toBeLessThan(una.indexOf("</body>"));
    expect(inyectarPie("<p>sin body</p>", "x.com")).toContain("Hecho por Sky Studios Labs");
  });
  it("usa http para localhost", () => {
    expect(urlRaiz("localhost:3000")).toBe("http://localhost:3000");
    expect(urlRaiz("demo.localhost:3000")).toBe("http://demo.localhost:3000");
    expect(urlRaiz("skystudioslabs.com")).toBe("https://skystudioslabs.com");
  });
  it("franja de propuesta tras <body> con padding, idempotente", () => {
    const html = inyectarFranja(HTML);
    expect(html).toContain('data-testid="franja-propuesta"');
    expect(html).toContain("Propuesta de diseño — boceto no oficial");
    expect(html).toMatch(/body\{padding-top:\d+px!important\}/);
    expect(html.indexOf("franja-propuesta")).toBeGreaterThan(html.indexOf("<body>"));
    expect(inyectarFranja(html)).toBe(html);
  });
  it("noindex en <head>, reemplazando meta robots previa", () => {
    const previo = HTML.replace("<title>", '<meta name="robots" content="index, follow"><title>');
    const html = inyectarNoindex(previo);
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(html).not.toContain("index, follow");
    expect(html.match(/name="robots"/g)).toHaveLength(1);
  });
  it("canonical y base no duplican los existentes", () => {
    const c = inyectarCanonical(HTML, "https://demo.skystudioslabs.com/");
    expect(c).toContain('<link rel="canonical" href="https://demo.skystudioslabs.com/">');
    expect(inyectarCanonical(c, "https://otro/")).toBe(c);
    const b = inyectarBase(HTML, "/c/demo/");
    expect(b).toContain('<base href="/c/demo/">');
    expect(inyectarBase(b, "/otro/")).toBe(b);
  });
  it("calcularBase solo cuando el navegador resolvería mal las rutas relativas", () => {
    expect(calcularBase("/", [], "index.html")).toBeNull();
    expect(calcularBase("/", ["menu"], "menu.html")).toBeNull();
    expect(calcularBase("/", ["blog"], "blog/index.html")).toBe("/blog/");
    expect(calcularBase("/c/demo/", [], "index.html")).toBe("/c/demo/");
    expect(calcularBase("/c/demo/", ["menu.html"], "menu.html")).toBeNull();
    expect(calcularBase("/propuesta-demo/", [], "index.html")).toBe("/propuesta-demo/");
  });
  it("rutaCanonica quita index.html y .html", () => {
    expect(rutaCanonica("index.html")).toBe("");
    expect(rutaCanonica("blog/index.html")).toBe("blog/");
    expect(rutaCanonica("menu.html")).toBe("menu");
  });
});

describe("tipoContenido", () => {
  it("tipos correctos y desconocidos rechazados", () => {
    expect(tipoContenido("html")).toMatch(/^text\/html/);
    expect(tipoContenido(".css")).toMatch(/^text\/css/);
    expect(tipoContenido("js")).toMatch(/javascript/);
    expect(tipoContenido("json")).toMatch(/^application\/json/);
    expect(tipoContenido("svg")).toBe("image/svg+xml");
    expect(tipoContenido("WEBP")).toBe("image/webp");
    expect(tipoContenido("avif")).toBe("image/avif");
    expect(tipoContenido("jpg")).toBe("image/jpeg");
    expect(tipoContenido("woff2")).toBe("font/woff2");
    expect(tipoContenido("pdf")).toBe("application/pdf");
    expect(tipoContenido("ico")).toBe("image/x-icon");
    expect(tipoContenido("xml")).toMatch(/xml/);
    expect(tipoContenido("txt")).toMatch(/^text\/plain/);
    expect(tipoContenido("php")).toBeNull();
    expect(tipoContenido("")).toBeNull();
  });
});

describe("estadoSitio", () => {
  const base: Sitio = {
    slug: "demo",
    tipo: "propuesta",
    prospecto_id: null,
    carpeta: "demo",
    dominio_propio: null,
    activo: true,
    expira: null,
    creado: "2026-01-01T00:00:00Z",
  };
  const ahora = new Date("2026-11-20T18:00:00Z"); // 12:00 en hora del centro de México
  it("no existe / ok / inactivo", () => {
    expect(estadoSitio(null, ahora)).toBe("no-existe");
    expect(estadoSitio(base, ahora)).toBe("ok");
    expect(estadoSitio({ ...base, activo: false }, ahora)).toBe("inactivo");
  });
  it("expira al terminar el día indicado", () => {
    expect(estadoSitio({ ...base, expira: "2026-11-19" }, ahora)).toBe("expirado");
    expect(estadoSitio({ ...base, expira: "2026-11-20" }, ahora)).toBe("ok");
    expect(estadoSitio({ ...base, expira: "2026-12-20" }, ahora)).toBe("ok");
    expect(estadoSitio({ ...base, expira: "2026-11-20T10:00:00Z" }, ahora)).toBe("expirado");
  });
});

describe("buscarImagenesPesadas", () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "sky-img-"));
    await mkdir(path.join(dir, "a", "img"), { recursive: true });
    await mkdir(path.join(dir, "a", "node_modules"), { recursive: true });
    await writeFile(path.join(dir, "a", "img", "ligera.webp"), Buffer.alloc(10 * 1024));
    await writeFile(path.join(dir, "a", "img", "justa.png"), Buffer.alloc(LIMITE_IMAGEN));
    await writeFile(path.join(dir, "a", "img", "pesada.JPG"), Buffer.alloc(LIMITE_IMAGEN + 1));
    await writeFile(path.join(dir, "a", "video.mp4"), Buffer.alloc(LIMITE_IMAGEN * 2));
    await writeFile(path.join(dir, "a", "node_modules", "x.png"), Buffer.alloc(LIMITE_IMAGEN * 2));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });
  it("lista solo imágenes > 300 KB, omitiendo node_modules", async () => {
    const r = await buscarImagenesPesadas([dir, path.join(dir, "no-existe")]);
    expect(r.map((x) => path.basename(x.ruta))).toEqual(["pesada.JPG"]);
    expect(r[0].bytes).toBe(LIMITE_IMAGEN + 1);
  });
});

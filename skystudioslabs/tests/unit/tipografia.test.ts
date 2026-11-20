import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Regla de marca: exactamente 3 tamaños de fuente en todo el sitio.
 * Sólo se permite var(--fs-display), var(--fs-title), var(--fs-body) o inherit.
 * Excepciones: definiciones de tokens dentro de :root en app/globals.css y la imagen OG
 * (app/opengraph-image.tsx, renderizada con Satori fuera del CSS).
 */
const RAIZ = path.resolve(__dirname, "../..");
const CARPETAS = ["app", "components"];

const EXCEPCIONES_ARCHIVO = new Set(["opengraph-image.tsx", "twitter-image.tsx"]);
const PERMITIDO = /^(var\(--fs-(display|title|body)\)|inherit)$/;

function archivos(dir: string): string[] {
  const out: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const full = path.join(dir, nombre);
    if (statSync(full).isDirectory()) out.push(...archivos(full));
    else if (/\.(css|ts|tsx)$/.test(nombre)) out.push(full);
  }
  return out;
}

/** Quita los bloques :root { ... } (tokens) de globals.css, incluidos los anidados en @media. */
function sinRoot(css: string): string {
  return css.replace(/:root\s*\{[^{}]*\}/g, "");
}

function limpiar(valor: string): string {
  return valor
    .trim()
    .replace(/!important/g, "")
    .replace(/^["'`{\s]+|["'`}\s]+$/g, "")
    .trim();
}

export function violaciones(rel: string, contenido: string): string[] {
  const texto = rel === path.join("app", "globals.css") ? sinRoot(contenido) : contenido;
  const malos: string[] = [];
  const patrones = [
    /font-size\s*[:=]\s*([^;}\n]+)/g, // CSS y atributo SVG font-size="…"
    /fontSize\s*[:=]\s*([^,}\n]+)/g, // React style / prop
    /(?<![-\w])font\s*:\s*([^;}\n]+)/g, // shorthand font: … (sólo CSS)
  ];
  patrones.forEach((re, i) => {
    if (i === 2 && !rel.endsWith(".css")) return;
    for (const m of texto.matchAll(re)) {
      const v = limpiar(m[1]);
      if (!PERMITIDO.test(v)) malos.push(`${rel}: ${m[0].trim()}`);
    }
  });
  return malos;
}

describe("tipografía: sólo 3 tamaños", () => {
  it("el detector reconoce valores prohibidos", () => {
    expect(violaciones("x.css", ".a{font-size:14px}")).toHaveLength(1);
    expect(violaciones("x.tsx", "<p style={{ fontSize: 12 }}/>")).toHaveLength(1);
    expect(violaciones("x.tsx", '<text fontSize="10">')).toHaveLength(1);
    expect(violaciones("x.css", ".a{font: 700 14px/1 sans-serif}")).toHaveLength(1);
    expect(violaciones("x.css", ".a{font-size: var(--fs-body) !important}")).toHaveLength(0);
    expect(violaciones("x.tsx", 'style={{ fontSize: "var(--fs-title)" }}')).toHaveLength(0);
    expect(violaciones("x.css", ".a{font-size:inherit}")).toHaveLength(0);
  });

  it("ningún archivo de app/ o components/ usa otro tamaño", () => {
    const malos: string[] = [];
    for (const carpeta of CARPETAS) {
      for (const full of archivos(path.join(RAIZ, carpeta))) {
        if (EXCEPCIONES_ARCHIVO.has(path.basename(full))) continue;
        const rel = path.relative(RAIZ, full);
        malos.push(...violaciones(rel, readFileSync(full, "utf8")));
      }
    }
    expect(malos, `Tamaños de fuente no permitidos:\n${malos.join("\n")}`).toEqual([]);
  });
});

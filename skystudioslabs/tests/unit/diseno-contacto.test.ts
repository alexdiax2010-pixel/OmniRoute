import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Contactos } from "@/components/chrome/Contactos";
import { NUMEROS, formatoTelefono } from "@/config/sitio";

// Los CSS Modules no importan aquí (y su PostCSS no carga en vitest): cada clase devuelve su nombre.
vi.mock("@/components/chrome/chrome.module.css", () => ({
  default: new Proxy({}, { get: (_t, clave) => String(clave) }),
}));

const RAIZ = path.resolve(__dirname, "../..");
const leer = (rel: string) => readFileSync(path.join(RAIZ, rel), "utf8");

describe("Contactos: los dos números con WhatsApp y llamada", () => {
  for (const variante of ["botones", "linea"] as const) {
    it(`variante "${variante}": cada número tiene WhatsApp y llamada con nombre accesible propio`, () => {
      const html = renderToStaticMarkup(createElement(Contactos, { variante }));
      for (const n of NUMEROS) {
        const tel = formatoTelefono(n);
        expect(html).toContain(`href="https://wa.me/${n}?text=`);
        expect(html).toContain(`href="tel:+${n}"`);
        expect(html).toContain(`aria-label="WhatsApp al ${tel}"`);
        expect(html).toContain(`aria-label="Llamar al ${tel}"`);
      }
    });
  }
});

describe("Sitio público: sin marcadores ni datos inventados a la vista", () => {
  it("la escena de cierre ya no muestra [MI_WHATSAPP] y usa los botones de contacto", () => {
    const src = leer("components/scenes/SceneCierre.tsx");
    expect(src).not.toContain("[MI_WHATSAPP]");
    expect(src).toContain('variante="botones"');
  });

  it("no hay reseñas de marcador en la portada", () => {
    const src = leer("components/scenes/SceneConstelacion.tsx");
    expect(src).not.toMatch(/RESEÑA REAL|NOMBRE Y NEGOCIO|Lo que dicen/);
  });

  it("los paquetes sin precio no muestran el marcador [PRECIO]", () => {
    const src = leer("components/scenes/ScenePrecios.tsx");
    expect(src).not.toContain('className="placeholder"');
  });

  it("el pie no imprime marcadores de correo o redes sin configurar", () => {
    const src = leer("components/chrome/Footer.tsx");
    expect(src).not.toContain('className="placeholder"');
  });
});

describe("Resaltado de marca (.hl)", () => {
  it("clona relleno y degradado por renglón para no recortar la última letra en itálica", () => {
    const css = leer("app/globals.css");
    const regla = css.match(/\.hl\s*\{[^}]*\}/)?.[0] ?? "";
    expect(regla).toMatch(/(^|[^-])box-decoration-break:\s*clone/);
    expect(regla).toMatch(/-webkit-box-decoration-break:\s*clone/);
  });

  it("tiene alternativa sólida en alto contraste (forced-colors)", () => {
    expect(leer("app/globals.css")).toMatch(/@media \(forced-colors: active\)/);
  });
});

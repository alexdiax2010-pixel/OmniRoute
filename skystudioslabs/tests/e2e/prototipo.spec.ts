import { test, expect } from "@playwright/test";
import { soloEscritorio } from "./helpers";

const TEMAS = [
  { slug: "negro-plata", nombre: "Negro + Plata", fondo: "rgb(13, 13, 13)" },
  { slug: "azul-marino", nombre: "Azul marino + Blanco", fondo: "rgb(15, 30, 58)" },
];

test.describe("Prototipos de paleta", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(soloEscritorio(testInfo), "prototipos sólo en desktop-1440");
  });

  for (const t of TEMAS) {
    test(`/prototipo/${t.slug}: misma portada con la paleta ${t.nombre}`, async ({ page }) => {
      const res = await page.goto(`/prototipo/${t.slug}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page.getByRole("navigation", { name: "Prototipos de paleta" })).toContainText(t.nombre);
      await expect(page.locator("h1")).toContainText("Sky Studios Labs");
      for (const escena of ["intro", "proceso", "precios", "cierre"]) {
        await expect(page.locator(`[data-scene="${escena}"]`)).toHaveCount(1);
      }
      const fondo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(fondo).toBe(t.fondo);
    });
  }

  test("la portada original conserva su paleta y los prototipos no están en el sitemap", async ({ page, request }) => {
    await page.goto("/");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(5, 5, 5)");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/prototipo");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /prototipo");
  });
});

import { test, expect } from "@playwright/test";
import { PAGINAS_SEO } from "../../lib/seo/paginas";
import { soloEscritorio } from "./helpers";

test.beforeEach(({}, testInfo) => {
  test.skip(soloEscritorio(testInfo), "SEO sólo en desktop-1440 (HTML del servidor)");
});

test.describe("Páginas SEO", () => {
  test("son 8", () => {
    expect(PAGINAS_SEO).toHaveLength(8);
  });

  for (const p of PAGINAS_SEO) {
    test(`/${p.slug}: 200, title, description y JSON-LD`, async ({ page }) => {
      const res = await page.goto(`/${p.slug}`);
      expect(res?.status()).toBe(200);
      expect((await page.title()).trim().length).toBeGreaterThan(0);
      const desc = await page.locator('meta[name="description"]').getAttribute("content");
      expect(desc?.trim().length ?? 0).toBeGreaterThan(20);
      const bloques = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(bloques.length).toBeGreaterThan(0);
      const tipos = JSON.stringify(bloques.map((b) => JSON.parse(b)));
      if (p.slug.startsWith("paginas-web-para-")) expect(tipos).toContain('"FAQPage"');
    });
  }
});

test("sitemap.xml lista las 8 páginas SEO y nada privado", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  for (const p of PAGINAS_SEO) expect(xml).toContain(`/${p.slug}</loc>`);
  expect(xml).not.toContain("propuesta");
  expect(xml).not.toContain("/admin");
  expect(xml).not.toContain("/portal");
});

test("robots.txt bloquea /admin y /portal", async ({ request }) => {
  const txt = await (await request.get("/robots.txt")).text();
  expect(txt).toMatch(/^Disallow: \/admin$/m);
  expect(txt).toMatch(/^Disallow: \/portal$/m);
});

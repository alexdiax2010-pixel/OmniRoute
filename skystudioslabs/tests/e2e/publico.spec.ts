import { test, expect, type Page } from "@playwright/test";

const ESCENAS = ["intro", "problema", "tachado", "web", "maps", "redes", "chatbot", "proceso", "constelacion", "precios", "cierre"];

const progreso = (page: Page) => page.evaluate(() => (window as unknown as { __skyProgress?: number }).__skyProgress ?? -1);

async function esperarAnimacion(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-anim-ready", "1", { timeout: 20_000 });
}

test.describe("Home pública", () => {
  test("carga con 200, h1 y todas las escenas en el HTML", async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "El HTML del servidor no depende del viewport");
    const res = await request.get("/");
    expect(res.status()).toBe(200);
    const html = await res.text();
    for (const escena of ESCENAS) expect(html, `falta data-scene="${escena}"`).toContain(`data-scene="${escena}"`);

    await page.goto("/");
    await expect(page.locator("h1").first()).toContainText("Sky Studios Labs");
  });

  test("la animación avanza con el scroll", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "reduced-motion", "Sin animación de scroll con movimiento reducido");
    await page.goto("/");
    await esperarAnimacion(page);
    const inicial = await progreso(page);
    expect(inicial).toBeGreaterThanOrEqual(0);
    expect(inicial).toBeLessThan(0.05);

    // Un poco de scroll "real" (rueda) → el progreso maestro sube.
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(150);
    }
    await expect.poll(() => progreso(page), { timeout: 10_000 }).toBeGreaterThan(inicial);
  });

  test("scroll hasta abajo lleva __skyProgress de ~0 a >0.9", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "reduced-motion", "Cubierto por la prueba de movimiento reducido");
    await page.goto("/");
    await esperarAnimacion(page);
    expect(await progreso(page)).toBeLessThan(0.05);
    // Scroll por pasos para que los pins se recalculen como en un scroll de usuario.
    for (let i = 0; i < 80; i++) {
      const fin = await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
        const el = document.scrollingElement!;
        return el.scrollTop + window.innerHeight >= el.scrollHeight - 2;
      });
      await page.waitForTimeout(60);
      if (fin) break;
    }
    await page.evaluate(() => window.scrollTo(0, document.scrollingElement!.scrollHeight));
    await expect.poll(() => progreso(page), { timeout: 10_000 }).toBeGreaterThan(0.9);
  });

  test("movimiento reducido: contenido visible y sin pins", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "reduced-motion", "Sólo para movimiento reducido");
    await page.goto("/");
    await esperarAnimacion(page);
    expect(await page.locator(".pin-spacer").count()).toBe(0);
    const fijados = await page.evaluate(() =>
      Array.from(document.querySelectorAll("section[data-scene] *")).filter((el) => getComputedStyle(el).position === "fixed").length
    );
    expect(fijados).toBe(0);
    for (const escena of ESCENAS) {
      const seccion = page.locator(`section[data-scene="${escena}"]`);
      await seccion.scrollIntoViewIfNeeded();
      const titulo = seccion.locator("h1, h2").first();
      await expect(titulo, `título visible en ${escena}`).toBeVisible();
      // Con movimiento reducido sólo hay fundidos cortos: el título debe terminar opaco.
      await expect
        .poll(
          () =>
            titulo.evaluate((el) => {
              let o = 1;
              for (let n: Element | null = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
              return o;
            }),
          { message: `opacidad del título en ${escena}`, timeout: 5_000 }
        )
        .toBeGreaterThan(0.9);
    }
  });

  test("botón flotante de WhatsApp visible", async ({ page }) => {
    await page.goto("/");
    // El FAB es el enlace fijo (hay otro botón de WhatsApp con la misma etiqueta en la escena "cierre").
    const fab = page.locator('a[aria-label="Escríbeme por WhatsApp"][class*="fab"]');
    await expect(fab).toHaveCount(1);
    await expect(fab).toBeVisible();
    expect(await fab.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");
  });

  test("sin scroll horizontal", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "reduced-motion", "Mismo viewport que desktop-1440");
    await page.goto("/");
    await esperarAnimacion(page);
    const medir = () =>
      page.evaluate(() => ({ sw: document.scrollingElement!.scrollWidth, iw: window.innerWidth }));
    let m = await medir();
    expect(m.sw, `scrollWidth ${m.sw} > innerWidth ${m.iw} (arriba)`).toBeLessThanOrEqual(m.iw + 1);
    // También a media página y al final (las escenas mueven elementos al hacer scroll).
    for (const f of [0.33, 0.66, 1]) {
      await page.evaluate((x) => window.scrollTo(0, document.scrollingElement!.scrollHeight * x), f);
      await page.waitForTimeout(300);
      m = await medir();
      expect(m.sw, `scrollWidth ${m.sw} > innerWidth ${m.iw} (scroll ${f})`).toBeLessThanOrEqual(m.iw + 1);
    }
  });

  test("sin JavaScript se ven la marca y el CTA", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name === "reduced-motion", "Cubierto por desktop-1440");
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: testInfo.project.use.viewport ?? undefined });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.getByText("SKY STUDIOS LABS", { exact: true }).first()).toBeVisible();
    // En celular el CTA del header vive en el menú; basta con que algún "Boceto gratis" sea visible.
    const ctas = page.getByText(/Boceto gratis/);
    await expect
      .poll(async () => {
        for (const l of await ctas.all()) if (await l.isVisible()) return true;
        return false;
      })
      .toBe(true);
    await ctx.close();
  });
});

import { test, expect } from "@playwright/test";
import { entrarConEnlaceLocal, PROSPECTOS_EJEMPLO, soloEscritorio, url } from "./helpers";

test.beforeEach(({}, testInfo) => {
  test.skip(soloEscritorio(testInfo), "CRM sólo en desktop-1440");
});

test.describe("CRM sin sesión", () => {
  for (const [nombre, destino] of [
    ["/admin en el dominio raíz", url(null, "/admin")],
    ["admin.localhost", url("admin", "/")],
  ] as const) {
    test(`${nombre} redirige al login y no muestra datos`, async ({ page }) => {
      await page.goto(destino);
      await expect(page).toHaveURL(/\/admin\/login|\/login/);
      await expect(page.getByLabel("Correo electrónico")).toBeVisible();
      const texto = await page.locator("body").innerText();
      for (const n of PROSPECTOS_EJEMPLO) expect(texto).not.toContain(n);
    });
  }

  test("exportar.csv sin sesión no entrega datos", async ({ request }) => {
    const res = await request.get("/admin/exportar.csv", { maxRedirects: 0 });
    expect([401, 302, 303, 307, 308]).toContain(res.status());
    const cuerpo = await res.text();
    for (const n of PROSPECTOS_EJEMPLO) expect(cuerpo).not.toContain(n);
  });

  test("un correo que no es admin no recibe enlace", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Correo electrónico").fill("cliente@sky.test");
    await page.getByRole("button", { name: /Enviarme el enlace/ }).click();
    await expect(page.getByText(/Si tu correo está registrado/)).toBeVisible();
    await expect(page.getByTestId("enlace-local")).toHaveCount(0);
  });
});

test("admin entra con enlace local y ve los 3 prospectos", async ({ page }) => {
  await entrarConEnlaceLocal(page, url(null, "/admin/login"), "admin@sky.test");
  await expect(page).toHaveURL(/\/admin\/?(\?.*)?$/);
  for (const n of PROSPECTOS_EJEMPLO) await expect(page.getByRole("link", { name: n }).first()).toBeVisible();

  // Con sesión, el CSV sí se descarga.
  const csv = await page.request.get("/admin/exportar.csv");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("Ejemplo Taller Uno");
});

test("admin.localhost: login con enlace local", async ({ page }) => {
  await entrarConEnlaceLocal(page, url("admin", "/login"), "admin@sky.test");
  await expect(page.getByRole("link", { name: PROSPECTOS_EJEMPLO[0] }).first()).toBeVisible();
});

test("el formulario público crea un prospecto con fuente web", async ({ page }) => {
  const negocio = `Negocio E2E ${Date.now()}`;
  await page.goto("/paginas-web-para-barberias");
  const form = page.locator('form[action="/api/prospectos"]').first();
  await form.scrollIntoViewIfNeeded();
  await form.getByLabel("Tu nombre").fill("Prueba E2E");
  await form.getByLabel("Nombre de tu negocio").fill(negocio);
  await form.getByLabel("WhatsApp").fill("33 1234 5678");
  await form.getByRole("button", { name: /Quiero mi boceto gratis/ }).click();
  await expect(form.getByText(/¡Gracias!/)).toBeVisible();

  await entrarConEnlaceLocal(page, url(null, "/admin/login"), "admin@sky.test");
  const enlace = page.getByRole("link", { name: negocio });
  await expect(enlace).toBeVisible();
  await enlace.click();
  await expect(page.getByText(/Fuente: web/)).toBeVisible();
});

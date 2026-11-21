import { test, expect } from "@playwright/test";
import { entrarConEnlaceLocal, PROSPECTOS_EJEMPLO, soloEscritorio, TELEFONOS_EJEMPLO, url } from "./helpers";

test.beforeEach(({}, testInfo) => {
  test.skip(soloEscritorio(testInfo), "Portal sólo en desktop-1440");
});

test("/portal sin sesión redirige al login", async ({ page }) => {
  await page.goto("/portal");
  await expect(page).toHaveURL(/\/portal\/login/);
});

test("el cliente ve sólo sus datos y no puede abrir el CRM", async ({ page }) => {
  await entrarConEnlaceLocal(page, url(null, "/portal/login"), "cliente@sky.test");
  await expect(page).toHaveURL(/\/portal\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ejemplo Estética Tres");
  // Su página (taller-demo, ligada en e2e:preparar)
  await expect(page.getByRole("link", { name: /taller-demo/ })).toBeVisible();

  const texto = await page.locator("body").innerText();
  for (const n of PROSPECTOS_EJEMPLO.filter((x) => x !== "Ejemplo Estética Tres")) expect(texto).not.toContain(n);
  for (const t of TELEFONOS_EJEMPLO) expect(texto).not.toContain(t);
  expect(texto).not.toMatch(/\b\d{10}\b/);
  const html = await page.content();
  for (const t of TELEFONOS_EJEMPLO) expect(html).not.toContain(t);

  // El cliente no entra al CRM.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  const textoAdmin = await page.locator("body").innerText();
  for (const n of PROSPECTOS_EJEMPLO) expect(textoAdmin).not.toContain(n);
  const csv = await page.request.get("/admin/exportar.csv", { maxRedirects: 0 });
  expect(csv.status()).toBe(401);
});

test("portal.localhost también exige sesión", async ({ page }) => {
  await page.goto(url("portal", "/"));
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
});

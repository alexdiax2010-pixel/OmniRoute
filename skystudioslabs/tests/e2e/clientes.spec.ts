import { test, expect } from "@playwright/test";
import { soloEscritorio, url } from "./helpers";

test.beforeEach(({}, testInfo) => {
  test.skip(soloEscritorio(testInfo), "Sitios de clientes sólo en desktop-1440");
});

test("subdominio de cliente activo muestra su página y el crédito", async ({ page }) => {
  const res = await page.goto(url("taller-demo"));
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Taller Demo/);
  await expect(page.getByText("Hecho por Sky Studios Labs")).toBeVisible();
  await expect(page.getByTestId("franja-propuesta")).toHaveCount(0);
});

test("/c/<slug> en el dominio raíz sirve el mismo sitio", async ({ page }) => {
  const res = await page.goto("/c/taller-demo");
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Taller Demo/);
  await expect(page.getByText("Hecho por Sky Studios Labs")).toBeVisible();
});

test("sitio inactivo muestra mantenimiento", async ({ page }) => {
  await page.goto(url("inactivo-demo"));
  await expect(page.getByRole("heading", { name: /mantenimiento/i })).toBeVisible();
});

test("propuesta: noindex (meta + cabecera) y franja de boceto", async ({ page }) => {
  const res = await page.goto(url("propuesta", "/propuesta-demo"));
  expect(res?.status()).toBe(200);
  expect(res?.headers()["x-robots-tag"] ?? "").toContain("noindex");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const franja = page.getByTestId("franja-propuesta");
  await expect(franja).toBeVisible();
  await expect(franja).toHaveText("Propuesta de diseño — boceto no oficial");
});

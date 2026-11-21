import { expect, type Page, type TestInfo } from "@playwright/test";

export const PUERTO = 3100;
export const url = (sub: string | null, ruta = "/") => `http://${sub ? `${sub}.` : ""}localhost:${PUERTO}${ruta}`;

/** Nombres de los prospectos de data/crm-prospectos.ejemplo.json. */
export const PROSPECTOS_EJEMPLO = ["Ejemplo Taller Uno", "Ejemplo Cafetería Dos", "Ejemplo Estética Tres"];
export const TELEFONOS_EJEMPLO = ["3300000001", "3300000002", "3300000003"];

/** Las pruebas de servidor (SEO, CRM, portal, clientes) sólo corren en el proyecto de escritorio. */
export function soloEscritorio(testInfo: TestInfo) {
  return testInfo.project.name !== "desktop-1440";
}

/**
 * Login con el enlace mágico simulado (modo local). `inicio` es la URL de login.
 */
export async function entrarConEnlaceLocal(page: Page, inicio: string, email: string) {
  await page.goto(inicio);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByRole("button", { name: /Enviarme el enlace/ }).click();
  const caja = page.getByTestId("enlace-local");
  await expect(caja).toContainText("Modo local: enlace de prueba");
  const href = await caja.getByRole("link").getAttribute("href");
  expect(href).toBeTruthy();
  // El enlace debe apuntar al mismo origen en el que se pidió (http en pruebas, mismo subdominio).
  expect(new URL(href!).origin).toBe(new URL(page.url()).origin);
  await page.goto(href!);
}

import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const ROOT = `localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://${ROOT}`,
    trace: "off",
  },
  projects: [
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile-375", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    {
      name: "reduced-motion",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" },
    },
  ],
  webServer: {
    command: `npm run e2e:preparar && npx next start -p ${PORT}`,
    url: `http://${ROOT}`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_ROOT_DOMAIN: ROOT,
      NEXT_PUBLIC_SITE_URL: `http://${ROOT}`,
      SKY_ALLOW_LOCAL_STORE: "1",
      SKY_DATA_FILE: ".data/e2e.json",
      ADMIN_EMAILS: "admin@sky.test",
      SKY_SECRET: "e2e-secret-no-usar-en-produccion",
      ADMIN_CODIGO: "Codigo-E2E-2026",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
});

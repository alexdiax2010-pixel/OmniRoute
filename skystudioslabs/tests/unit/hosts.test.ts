import { describe, it, expect } from "vitest";
import { resolverHost, rutaReescrita, SUBDOMINIOS_RESERVADOS } from "@/lib/hosts";

const ROOT = "skystudioslabs.com";

describe("resolverHost", () => {
  it("dominio raíz y www son el sitio público", () => {
    expect(resolverHost("skystudioslabs.com", ROOT)).toEqual({ tipo: "publico" });
    expect(resolverHost("www.skystudioslabs.com", ROOT)).toEqual({ tipo: "publico" });
    expect(resolverHost("SkyStudiosLabs.com:443", ROOT)).toEqual({ tipo: "publico" });
  });
  it("un subdominio libre es un cliente", () => {
    expect(resolverHost("taller-ramirez.skystudioslabs.com", ROOT)).toEqual({ tipo: "cliente", slug: "taller-ramirez" });
  });
  it("los subdominios reservados nunca son clientes", () => {
    for (const sub of SUBDOMINIOS_RESERVADOS) {
      expect(resolverHost(`${sub}.skystudioslabs.com`, ROOT).tipo).not.toBe("cliente");
    }
    expect(resolverHost("admin.skystudioslabs.com", ROOT).tipo).toBe("admin");
    expect(resolverHost("portal.skystudioslabs.com", ROOT).tipo).toBe("portal");
    expect(resolverHost("propuesta.skystudioslabs.com", ROOT).tipo).toBe("propuesta");
    expect(resolverHost("api.skystudioslabs.com", ROOT).tipo).toBe("reservado");
    expect(resolverHost("app.skystudioslabs.com", ROOT).tipo).toBe("reservado");
  });
  it("sub-subdominios y slugs inválidos se rechazan", () => {
    expect(resolverHost("a.b.skystudioslabs.com", ROOT).tipo).toBe("reservado");
    expect(resolverHost("-malo.skystudioslabs.com", ROOT).tipo).toBe("reservado");
  });
  it("otro dominio es un dominio propio de cliente", () => {
    expect(resolverHost("www.tallerramirez.mx", ROOT)).toEqual({ tipo: "dominio-propio", host: "www.tallerramirez.mx" });
  });
  it("funciona con localhost en desarrollo", () => {
    expect(resolverHost("localhost:3000", "localhost:3000")).toEqual({ tipo: "publico" });
    expect(resolverHost("demo.localhost:3000", "localhost:3000")).toEqual({ tipo: "cliente", slug: "demo" });
  });
  it("vista previa de Vercel es público", () => {
    expect(resolverHost("sky-abc123.vercel.app", ROOT)).toEqual({ tipo: "publico" });
  });
});

describe("rutaReescrita", () => {
  it("cliente → /sitios/<slug>", () => {
    expect(rutaReescrita({ tipo: "cliente", slug: "demo" }, "/")).toBe("/sitios/demo");
    expect(rutaReescrita({ tipo: "cliente", slug: "demo" }, "/img/a.webp")).toBe("/sitios/demo/img/a.webp");
  });
  it("/c/<slug> en el dominio raíz es el respaldo", () => {
    expect(rutaReescrita({ tipo: "publico" }, "/c/demo")).toBe("/sitios/demo");
    expect(rutaReescrita({ tipo: "publico" }, "/c/demo/menu.html")).toBe("/sitios/demo/menu.html");
    expect(rutaReescrita({ tipo: "publico" }, "/precios")).toBeNull();
  });
  it("propuesta, admin y portal", () => {
    expect(rutaReescrita({ tipo: "propuesta" }, "/barberia-luna")).toBe("/propuestas/barberia-luna");
    expect(rutaReescrita({ tipo: "admin" }, "/")).toBe("/admin");
    expect(rutaReescrita({ tipo: "admin" }, "/admin/x")).toBeNull();
    expect(rutaReescrita({ tipo: "portal" }, "/")).toBe("/portal");
  });
  it("dominio propio → /sitios/_d/<host>", () => {
    expect(rutaReescrita({ tipo: "dominio-propio", host: "x.mx" }, "/")).toBe("/sitios/_d/x.mx");
  });
});

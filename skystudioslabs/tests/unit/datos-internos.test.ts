import { describe, it, expect } from "vitest";
import { aFila, dividirFila, COLUMNAS_INTERNAS } from "@/lib/data/supabase";

describe("datos internos separados (prospectos_internos solo admins)", () => {
  it("los campos de venta van a la tabla interna y los de contrato a la de cliente", () => {
    const { publica, interna } = dividirFila(
      aFila({
        id: "1", nombre: "Taller", telefono: "3300000001", whatsapp: "3300000001", razon: "x", guion: "y",
        notas: [{ t: "t", txt: "n" }], etapa: "Ganado", paquete: "estandar", mensualidad: 500, diaCobro: 5,
        servicios: ["web"], email: "A@B.MX",
      })
    );
    expect(Object.keys(interna).sort()).toEqual(["etapa", "guion", "notas", "razon", "telefono", "whatsapp"]);
    expect(publica).toMatchObject({ id: "1", nombre: "Taller", paquete: "estandar", mensualidad: 500, dia_cobro: 5, email: "a@b.mx" });
    for (const c of COLUMNAS_INTERNAS) expect(publica).not.toHaveProperty(c);
  });
});

import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { aCSV } from "@/lib/crm/csv";
import { hoyMX } from "@/lib/crm/fechas";

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "id", "nombre", "giro", "categoria", "colonia", "direccion", "telefono", "whatsapp", "email", "puntaje",
  "top10", "etapa", "seguimiento", "paquete", "monto", "mensualidad", "diaCobro", "servicios", "fechaGanado",
  "fuente", "razon", "alertas", "mensaje", "creado", "actualizado",
] as const;

/** Exportación CSV del CRM. SOLO admin. Celdas protegidas contra inyección de fórmulas. */
export async function GET() {
  const sesion = await obtenerSesion();
  if (sesion?.rol !== "admin") return new NextResponse("No autorizado", { status: 401 });
  try {
    const lista = await (await getRepo()).listarProspectos();
    const csv = aCSV([...COLUMNAS], lista.map((p) => COLUMNAS.map((c) => p[c])));
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="prospectos-${hoyMX()}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("No se pudo exportar", { status: 500 });
  }
}

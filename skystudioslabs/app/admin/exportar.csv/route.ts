import { NextResponse, type NextRequest } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { aCSV } from "@/lib/crm/csv";
import { hoyMX } from "@/lib/crm/fechas";
import { filtrarYOrdenar, hayFiltros, leerFiltros } from "@/lib/crm/lista";

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "id", "nombre", "giro", "categoria", "colonia", "direccion", "telefono", "whatsapp", "email", "puntaje",
  "top10", "etapa", "seguimiento", "paquete", "monto", "mensualidad", "diaCobro", "servicios", "fechaGanado",
  "fuente", "sesion", "boceto", "razon", "alertas", "mensaje", "guion", "notas", "creado", "actualizado",
] as const;

/**
 * Exportación CSV del CRM. SOLO admin. Celdas protegidas contra inyección de fórmulas.
 * Acepta los mismos filtros que la lista (?q=&etapa=&categoria=&min=&top10=1&tel=1&boceto=1&orden=&dir=).
 */
export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (sesion?.rol !== "admin") return new NextResponse("No autorizado", { status: 401 });
  try {
    const todos = await (await getRepo()).listarProspectos();
    const f = leerFiltros(Object.fromEntries(request.nextUrl.searchParams));
    const lista = filtrarYOrdenar(todos, f);
    const celda = (p: (typeof lista)[number], c: (typeof COLUMNAS)[number]) => (c === "notas" ? p.notas.map((n) => n.txt) : p[c]);
    const csv = aCSV([...COLUMNAS], lista.map((p) => COLUMNAS.map((c) => celda(p, c))));
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="prospectos-${hoyMX()}${hayFiltros(f) ? "-filtrado" : ""}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("No se pudo exportar", { status: 500 });
  }
}

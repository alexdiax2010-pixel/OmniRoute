import { NextResponse, type NextRequest } from "next/server";
import { getRepo } from "@/lib/data";
import { secreto } from "@/lib/auth";
import { camposDelCuerpo, evaluarLead, hashIp, ipDeCabeceras, leerCuerpoLimitado, LIMITE_ENVIOS_HORA, prospectoDesdeLead } from "@/lib/lead";
import { after } from "next/server";
import { avisoNuevoCliente, enviarAvisoPush } from "@/lib/push";

/**
 * POST /api/prospectos — formulario público de contacto (JSON o form).
 * Orden: tamaño → honeypot (finge éxito) → Zod → rate limit (5/h por IP con hash) → guardar.
 * Nunca devuelve datos del CRM ni errores internos.
 */
const MAX_BYTES = 8 * 1024;

function responder(request: NextRequest, esForm: boolean, status: number, cuerpo: Record<string, unknown>) {
  if (!esForm) return NextResponse.json(cuerpo, { status, headers: { "Cache-Control": "no-store" } });
  // Sin JS: regresa a la página de origen (mismo sitio) con el resultado.
  let destino = new URL("/", request.nextUrl);
  const ref = request.headers.get("referer");
  if (ref) {
    try {
      const u = new URL(ref);
      if (u.host === request.nextUrl.host) destino = new URL(u.pathname, request.nextUrl);
    } catch {
      // referer inválido
    }
  }
  destino.searchParams.set("lead", cuerpo.ok ? "ok" : "error");
  destino.hash = "contacto";
  return NextResponse.redirect(destino, 303);
}

export async function POST(request: NextRequest) {
  const tipo = request.headers.get("content-type") ?? "";
  const esForm = tipo.includes("application/x-www-form-urlencoded") || tipo.includes("multipart/form-data");
  const largo = Number(request.headers.get("content-length") ?? 0);
  if (largo > MAX_BYTES) return responder(request, esForm, 413, { ok: false, error: "Solicitud demasiado grande." });

  // El tamaño se vuelve a medir al leer: Content-Length puede faltar (chunked) o mentir.
  const bytes = await leerCuerpoLimitado(request.body, MAX_BYTES).catch(() => new Uint8Array(0));
  if (!bytes) return responder(request, esForm, 413, { ok: false, error: "Solicitud demasiado grande." });
  let datos: Record<string, unknown>;
  try {
    datos = await camposDelCuerpo(bytes, tipo);
  } catch {
    return responder(request, esForm, 400, { ok: false, error: "No pudimos leer el formulario." });
  }

  const r = evaluarLead(datos);
  if (r.tipo === "spam") return responder(request, esForm, 200, { ok: true });
  if (r.tipo === "invalido") return responder(request, esForm, 422, { ok: false, error: "Revisa los campos marcados.", campos: r.campos });

  try {
    const repo = await getRepo();
    const ipHash = hashIp(ipDeCabeceras(request.headers), secreto());
    const n = await repo.registrarEnvio(ipHash, new Date(Date.now() - 3600_000).toISOString());
    if (n > LIMITE_ENVIOS_HORA) {
      return responder(request, esForm, 429, { ok: false, error: "Recibimos varios envíos desde tu conexión. Inténtalo más tarde o escríbenos por WhatsApp." });
    }
    await repo.crearProspecto(prospectoDesdeLead(r.lead));
    // Notificación al teléfono del dueño, después de responder (no retrasa al visitante).
    const lead = r.lead;
    after(() => enviarAvisoPush(avisoNuevoCliente(lead)));
    return responder(request, esForm, 200, { ok: true });
  } catch (e) {
    console.error("[lead] no se pudo guardar", e instanceof Error ? e.message : "");
    return responder(request, esForm, 500, { ok: false, error: "No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos por WhatsApp." });
  }
}

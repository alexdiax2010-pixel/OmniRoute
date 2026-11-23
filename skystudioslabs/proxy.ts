import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { resolverHost, rutaReescrita } from "@/lib/hosts";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/env";
import { cabecerasSeguridad, esPaginaPropia, hostSinWww, robotsPorHost } from "@/lib/seo/cabeceras";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "skystudioslabs.com";

type CookiePendiente = { name: string; value: string; options: Record<string, unknown> };

/**
 * Supabase: refresca la sesión (tokens) SOLO en rutas de admin/portal/auth.
 * Actualiza también las cookies de la petición para que el render actual vea el token nuevo.
 * La autorización real se verifica en cada página / Server Action (requerirAdmin / requerirCliente).
 */
async function refrescarSesion(request: NextRequest): Promise<{ cookies: CookiePendiente[]; headers: Record<string, string> }> {
  const pendientes: CookiePendiente[] = [];
  let cabeceras: Record<string, string> = {};
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  if (!url || !anon) return { cookies: pendientes, headers: cabeceras };
  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista, h) => {
          for (const c of lista) {
            request.cookies.set(c.name, c.value);
            pendientes.push(c as CookiePendiente);
          }
          cabeceras = h ?? {};
        },
      },
    });
    await supabase.auth.getUser();
  } catch {
    // Si Supabase no responde, seguimos: la página volverá a validar la sesión.
  }
  return { cookies: pendientes, headers: cabeceras };
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const destino = resolverHost(host, ROOT);

  // Una sola versión del sitio: www.<root> → <root> (308 conserva método y cuerpo).
  const sinWww = hostSinWww(host, ROOT);
  if (sinWww) {
    const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || url.protocol.replace(/:$/, "");
    // Location absoluta a mano: NextResponse.redirect la vuelve relativa si cree que es el mismo origen.
    return new NextResponse(null, { status: 308, headers: { Location: `${proto}://${sinWww}${url.pathname}${url.search}` } });
  }

  if (destino.tipo === "reservado") {
    return new NextResponse("No encontrado", { status: 404 });
  }

  // En el dominio raíz, las rutas internas no se abren directo.
  if (destino.tipo === "publico" && url.pathname.startsWith("/sitios/")) {
    const resto = url.pathname.slice("/sitios/".length);
    if (resto.startsWith("_d/")) return new NextResponse("No encontrado", { status: 404 });
    return NextResponse.redirect(new URL(`/c/${resto}`, request.url), 308);
  }

  const necesitaSesion =
    destino.tipo === "admin" ||
    destino.tipo === "portal" ||
    /^\/(admin|portal|auth)(\/|$)/.test(url.pathname);
  const sesion = necesitaSesion ? await refrescarSesion(request) : null;

  const destinoRuta = rutaReescrita(destino, url.pathname);
  const headers = new Headers(request.headers);
  headers.set("x-sky-destino", destino.tipo);
  const respuesta = destinoRuta
    ? (() => {
        const nueva = url.clone();
        nueva.pathname = destinoRuta;
        return NextResponse.rewrite(nueva, { request: { headers } });
      })()
    : NextResponse.next({ request: { headers } });

  if (esPaginaPropia(destino, destinoRuta)) {
    for (const [k, v] of Object.entries(cabecerasSeguridad(process.env.NODE_ENV === "development"))) respuesta.headers.set(k, v);
  }
  const robots = robotsPorHost(destino, host);
  if (robots) respuesta.headers.set("X-Robots-Tag", robots);

  if (sesion) {
    for (const c of sesion.cookies) respuesta.cookies.set(c.name, c.value, c.options);
    for (const [k, v] of Object.entries(sesion.headers)) respuesta.headers.set(k, v);
  }
  return respuesta;
}

export const config = {
  matcher: [
    // Todo excepto assets internos de Next y archivos de metadatos.
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|sw.js|crm.webmanifest).*)",
  ],
};

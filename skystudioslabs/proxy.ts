import { NextResponse, type NextRequest } from "next/server";
import { resolverHost, rutaReescrita } from "@/lib/hosts";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "skystudioslabs.com";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const destino = resolverHost(host, ROOT);

  if (destino.tipo === "reservado") {
    return new NextResponse("No encontrado", { status: 404 });
  }

  // En el dominio raíz, las rutas internas no se abren directo.
  if (destino.tipo === "publico" && url.pathname.startsWith("/sitios/")) {
    const resto = url.pathname.slice("/sitios/".length);
    if (resto.startsWith("_d/")) return new NextResponse("No encontrado", { status: 404 });
    return NextResponse.redirect(new URL(`/c/${resto}`, request.url), 308);
  }

  const destinoRuta = rutaReescrita(destino, url.pathname);
  const headers = new Headers(request.headers);
  headers.set("x-sky-destino", destino.tipo);
  if (!destinoRuta) return NextResponse.next({ request: { headers } });

  const nueva = url.clone();
  nueva.pathname = destinoRuta;
  return NextResponse.rewrite(nueva, { request: { headers } });
}

export const config = {
  matcher: [
    // Todo excepto assets internos de Next y archivos de metadatos.
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml).*)",
  ],
};

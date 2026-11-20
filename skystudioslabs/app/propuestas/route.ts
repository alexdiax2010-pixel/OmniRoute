import { paginaNeutral, rootDominio, urlRaiz } from "@/lib/sitios/servir";

export const runtime = "nodejs";

/** propuesta.ROOT/ sin slug → página mínima noindex que lleva al sitio principal. */
export function GET() {
  const url = urlRaiz(rootDominio());
  const html = paginaNeutral(
    "Propuestas de Sky Studios Labs",
    "Aquí compartimos bocetos privados con nuestros prospectos. Te llevamos al sitio principal…",
    `<p><a href="${url}">Ir a Sky Studios Labs</a></p><meta http-equiv="refresh" content="3;url=${url}">`
  );
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

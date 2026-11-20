/**
 * Resolución de host → tipo de destino. Función pura (testeable), usada por proxy.ts.
 */
export const SUBDOMINIOS_RESERVADOS = ["www", "admin", "app", "api", "propuesta", "portal"] as const;

export type Destino =
  | { tipo: "publico" }
  | { tipo: "cliente"; slug: string }
  | { tipo: "propuesta" }
  | { tipo: "admin" }
  | { tipo: "portal" }
  | { tipo: "reservado"; sub: string }
  | { tipo: "dominio-propio"; host: string };

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function esSlugValido(slug: string): boolean {
  return SLUG_RE.test(slug);
}

/** Quita puerto y pasa a minúsculas. */
export function normalizarHost(host: string | null | undefined): string {
  return (host ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

/**
 * @param host     cabecera Host (puede traer puerto)
 * @param rootDomain dominio raíz, ej. "skystudioslabs.com" o "localhost:3000"
 */
export function resolverHost(host: string | null | undefined, rootDomain: string): Destino {
  const h = normalizarHost(host);
  const root = normalizarHost(rootDomain);
  if (!h || h === root || h === "localhost" || h === "127.0.0.1") return { tipo: "publico" };
  // Despliegues de vista previa de Vercel → sitio público
  if (h.endsWith(".vercel.app")) return { tipo: "publico" };

  if (h.endsWith(`.${root}`)) {
    const sub = h.slice(0, -(root.length + 1));
    if (sub.includes(".")) return { tipo: "reservado", sub }; // sub-subdominios no soportados
    if (sub === "www") return { tipo: "publico" };
    if (sub === "admin") return { tipo: "admin" };
    if (sub === "portal") return { tipo: "portal" };
    if (sub === "propuesta") return { tipo: "propuesta" };
    if ((SUBDOMINIOS_RESERVADOS as readonly string[]).includes(sub)) return { tipo: "reservado", sub };
    if (!esSlugValido(sub)) return { tipo: "reservado", sub };
    return { tipo: "cliente", slug: sub };
  }
  return { tipo: "dominio-propio", host: h };
}

/** Rutas internas que nunca deben abrirse directo en el dominio raíz (sólo vía reescritura). */
export const RUTAS_INTERNAS = ["/sitios", "/propuestas"];

/**
 * Calcula la ruta interna a la que el proxy debe reescribir. Devuelve null si no hay reescritura.
 */
export function rutaReescrita(destino: Destino, pathname: string): string | null {
  const p = pathname === "/" ? "" : pathname;
  switch (destino.tipo) {
    case "cliente":
      return `/sitios/${destino.slug}${p}`;
    case "propuesta": {
      // propuesta.dominio.com/<slug>/...  →  /propuestas/<slug>/...
      if (!p) return "/propuestas";
      return `/propuestas${p}`;
    }
    case "admin":
      return pathname.startsWith("/admin") || pathname.startsWith("/api/") || pathname.startsWith("/auth/") ? null : `/admin${p}`;
    case "portal":
      return pathname.startsWith("/portal") || pathname.startsWith("/api/") || pathname.startsWith("/auth/") ? null : `/portal${p}`;
    case "dominio-propio":
      return `/sitios/_d/${destino.host}${p}`;
    case "publico": {
      const m = pathname.match(/^\/c\/([^/]+)(\/.*)?$/);
      if (m) return `/sitios/${m[1]}${m[2] ?? ""}`;
      return null;
    }
    default:
      return null;
  }
}

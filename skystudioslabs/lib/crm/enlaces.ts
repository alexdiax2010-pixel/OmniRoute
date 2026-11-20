/** Enlaces públicos de propuestas y sitios de clientes. */
function root(): string {
  return (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "skystudioslabs.com").trim().replace(/\/$/, "");
}
function proto(r: string): string {
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(r) || r.endsWith(".localhost") || /\.localhost:\d+$/.test(r) ? "http" : "https";
}
export function urlPropuesta(slug: string): string {
  const r = root();
  return `${proto(r)}://propuesta.${r}/${slug}`;
}
export function urlCliente(slug: string): string {
  const r = root();
  return `${proto(r)}://${slug}.${r}`;
}
/** Agrega el enlace al mensaje si aún no lo trae. */
export function mensajeConEnlace(mensaje: string, enlace: string): string {
  if (mensaje.includes(enlace)) return mensaje;
  const base = mensaje.trim();
  return `${base}${base ? "\n\n" : ""}Mira tu propuesta aquí: ${enlace}`;
}

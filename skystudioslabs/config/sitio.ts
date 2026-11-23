/**
 * Datos de contacto y marca. EDITA ESTE ARCHIVO con tus datos reales.
 * Los valores entre corchetes son marcadores visibles a propósito.
 */
export const SITIO = {
  nombre: "Sky Studios Labs",
  dominio: "skystudioslabs.com",
  /** Número en formato internacional sin "+" ni espacios, ej. 5233XXXXXXXX. */
  whatsapp: "524492889487",
  /** Teléfono para llamadas (formato internacional sin "+"). */
  telefono: "523330282202",
  correo: "[MI_CORREO]",
  pais: "MX",
  /** Zona que atendemos (schema.org areaServed). */
  area: "México",
  mensajeWhatsApp: "Hola, vi su página y quiero mi boceto gratis para mi negocio.",
  redes: {
    instagram: "[MI_INSTAGRAM]",
    facebook: "[MI_FACEBOOK]",
  },
} as const;

/** true si el número de WhatsApp ya fue configurado (no es marcador). */
export const whatsappConfigurado = /^\d{10,15}$/.test(SITIO.whatsapp);

/** Link wa.me con mensaje. Si el número aún es marcador, devuelve "#whatsapp-pendiente". */
export function linkWhatsApp(mensaje: string = SITIO.mensajeWhatsApp, numero: string = SITIO.whatsapp): string {
  const limpio = numero.replace(/\D/g, "");
  if (limpio.length < 10) return "#whatsapp-pendiente";
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
}

/** "+52 33 3028 2202" a partir de "523330282202". */
export function formatoTelefono(numero: string): string {
  const d = numero.replace(/\D/g, "");
  const m = d.match(/^52(\d{2})(\d{4})(\d{4})$/);
  return m ? `+52 ${m[1]} ${m[2]} ${m[3]}` : `+${d}`;
}

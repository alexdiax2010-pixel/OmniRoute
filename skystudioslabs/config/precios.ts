/**
 * Paquetes y precios. EDITA ESTE ARCHIVO: el sitio, las páginas SEO y el CRM lo leen.
 * Montos en pesos mexicanos (MXN). Los montos actuales son MARCADORES: cámbialos por tus precios reales.
 */
export type Paquete = {
  id: "basico" | "estandar" | "premium";
  nombre: string;
  /** Pago único en MXN. null = mostrar marcador "[PRECIO]". */
  precio: number | null;
  /** Texto corto debajo del precio. */
  nota: string;
  incluye: string[];
  destacado?: boolean;
};

export const PAQUETES: Paquete[] = [
  {
    id: "basico",
    nombre: "Básico",
    precio: null,
    nota: "Pago único",
    incluye: [
      "Página de una sección (landing)",
      "Botón de WhatsApp y llamada",
      "Mapa de ubicación",
      "Adaptada a celular",
      "Link en skystudioslabs.com",
    ],
  },
  {
    id: "estandar",
    nombre: "Estándar",
    precio: null,
    nota: "Pago único",
    destacado: true,
    incluye: [
      "Todo lo del Básico",
      "Hasta 5 secciones (servicios, galería, horarios, contacto)",
      "Alta y optimización en Google Maps",
      "SEO local básico",
    ],
  },
  {
    id: "premium",
    nombre: "Premium",
    precio: null,
    nota: "Pago único",
    incluye: [
      "Todo lo del Estándar",
      "Chatbot de WhatsApp",
      "Menú o catálogo con código QR",
      "Plan de publicaciones para redes",
    ],
  },
];

export const MANTENIMIENTO = {
  nombre: "Mantenimiento mensual",
  /** MXN al mes. */
  precio: 1099 as number | null,
  incluye: ["Hosting en tu link", "Cambios menores cada mes", "Soporte por WhatsApp"],
};

export const SERVICIOS = ["web", "maps", "redes", "chatbot", "menuqr"] as const;
export type Servicio = (typeof SERVICIOS)[number];
export const NOMBRE_SERVICIO: Record<Servicio, string> = {
  web: "Página web",
  maps: "Google Maps",
  redes: "Redes sociales",
  chatbot: "Chatbot",
  menuqr: "Menú QR",
};

export function formatoPrecio(precio: number | null): string {
  if (precio == null) return "[PRECIO]";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(precio);
}

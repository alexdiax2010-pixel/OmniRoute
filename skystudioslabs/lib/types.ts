import type { Servicio } from "@/config/precios";

export const ETAPAS = ["Nuevo", "Contactado", "Boceto enviado", "Negociando", "Ganado", "Perdido"] as const;
export type Etapa = (typeof ETAPAS)[number];

export type Nota = { t: string; txt: string };

export type Prospecto = {
  id: string;
  nombre: string;
  giro: string;
  categoria: string;
  colonia: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  puntaje: number;
  razon: string;
  alertas: string[];
  top10: boolean;
  etapa: Etapa;
  /** ISO date (YYYY-MM-DD) o null */
  seguimiento: string | null;
  mensaje: string;
  guion: string;
  notas: Nota[];
  boceto: string;
  fuente: string;
  sesion: string;
  paquete: string | null;
  monto: number | null;
  mensualidad: number | null;
  diaCobro: number | null;
  servicios: Servicio[];
  /** ISO date o null */
  fechaGanado: string | null;
  /** correo del cliente para el portal */
  email: string | null;
  creado: string;
  actualizado: string;
};

export type TipoSitio = "propuesta" | "cliente";

export type Sitio = {
  slug: string;
  tipo: TipoSitio;
  prospecto_id: string | null;
  /** carpeta relativa a /clientes, ej. "taller-ramirez" */
  carpeta: string;
  dominio_propio: string | null;
  activo: boolean;
  /** ISO date o null (solo propuestas) */
  expira: string | null;
  creado: string;
};

export type SolicitudCambio = {
  id: string;
  prospecto_id: string;
  texto: string;
  /** ruta en storage o data URL en modo local */
  foto: string | null;
  creado: string;
};

export type SuscripcionPush = { endpoint: string; p256dh: string; auth: string; etiqueta: string };

export type Sesion =
  | { rol: "admin"; email: string }
  | { rol: "cliente"; email: string; prospectoId: string };

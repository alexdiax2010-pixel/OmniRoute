/**
 * Clientes reales que aparecen en "Nuestros clientes" de la portada. EDITA ESTE ARCHIVO para
 * agregar más. Solo clientes reales con permiso para mostrarlos; nada inventado.
 * Las imágenes van en public/portafolio/ (WebP, máximo 300 KB; npm run check:images lo verifica).
 */
export type ClientePortafolio = {
  nombre: string;
  giro: string;
  /** Qué le hicimos, en una frase. */
  trabajo: string;
  /** Lo que incluye (3 a 5 puntos). */
  incluye: string[];
  imagen: { src: string; alt: string; ancho: number; alto: number };
  /** slug de su sitio en skystudioslabs.com si lo tiene publicado (así no cuenta doble en la constelación). */
  slug?: string;
};

export const PORTAFOLIO: ClientePortafolio[] = [
  {
    nombre: "Wellness Fitness 5AM",
    giro: "Gimnasio",
    trabajo: "Sistema de entrada con código para socios, cobros y avisos de vencimiento.",
    incluye: [
      "Pantalla de entrada para la recepción: el socio escribe su código y ve si puede pasar",
      "Panel del dueño con socios, cobros e ingresos del mes",
      "Avisos de vencimiento listos para enviar por WhatsApp",
      "Rachas de visitas y frases motivacionales para los socios",
    ],
    imagen: {
      src: "/portafolio/wellness-5am-panel.webp",
      alt: "Panel de administración del sistema de Wellness Fitness 5AM con ingresos del mes, socios activos y entradas del día (datos de ejemplo)",
      ancho: 1280,
      alto: 800,
    },
  },
];

/** Clientes del portafolio que no tienen sitio publicado (cuentan como estrella aparte). */
export const clientesSinSitio = () => PORTAFOLIO.filter((c) => !c.slug).length;

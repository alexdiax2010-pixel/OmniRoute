/**
 * Contenido de las 8 páginas SEO (4 servicios + 4 giros). Se pintan con la plantilla
 * components/seo/PlantillaSEO.tsx. En `h1` y en los títulos de sección, el texto entre
 * *asteriscos* se resalta en brasa/naranja (máximo 1–2 palabras por frase).
 *
 * Regla de contenido: nada de números de clientes, porcentajes, testimonios ni tiempos
 * garantizados inventados. Donde haga falta un dato real del negocio, usa un marcador
 * visible entre corchetes, ej. [TIEMPO DE ENTREGA].
 */
import type { FAQ } from "./schema";

export type Bloque = { titulo: string; texto: string };

export type VarianteEjemplo =
  | "web"
  | "maps"
  | "redes"
  | "chatbot"
  | "dentista"
  | "taller"
  | "barberia"
  | "restaurante";

export type PaginaSEO = {
  slug: string;
  tipo: "servicio" | "giro";
  /** Etiqueta corta para menús y pie de página. */
  menu: string;
  /** <title> (la plantilla del layout agrega "| Sky Studios Labs"). */
  titulo: string;
  /** Meta description (~150–160 caracteres). */
  descripcion: string;
  /** Encabezado visible. Palabras > 10 letras rompen en celular: mantenlo corto. */
  h1: string;
  /** Línea corta sobre el h1. */
  antetitulo: string;
  intro: string;
  ejemplo: VarianteEjemplo;
  problemasTitulo: string;
  problemas: Bloque[];
  incluyeTitulo: string;
  incluye: Bloque[];
  /** Nota honesta opcional (ej. no garantizamos el primer lugar en Google). */
  nota?: string;
  faqs: FAQ[];
  /** Datos para el schema.org Service. */
  servicio: { nombre: string; descripcion: string };
  /** Mensaje prellenado de WhatsApp. */
  mensajeWhatsApp: string;
};

// ---------------------------------------------------------------------------
// Preguntas frecuentes compartidas por las páginas de giro
// ---------------------------------------------------------------------------
const faqTiempo: FAQ = {
  pregunta: "¿Cuánto tarda?",
  respuesta:
    "El boceto te lo enseñamos antes de que pagues nada. Ya que lo apruebas, el tiempo de entrega es de [TIEMPO DE ENTREGA] y depende sobre todo de qué tan rápido nos compartas tus fotos y datos. Te avisamos por WhatsApp en cada paso.",
};

const faqDominio: FAQ = {
  pregunta: "¿Incluye dominio?",
  respuesta:
    "Incluye un link propio tipo tunegocio.skystudioslabs.com, listo para compartir, ponerlo en tu Google Maps y en tus redes. Si prefieres un dominio propio .com o .mx, lo configuramos como un extra; el dominio se paga al registrador y se renueva cada año.",
};

const faqCambios: FAQ = {
  pregunta: "¿Puedo hacer cambios?",
  respuesta:
    "Sí. Antes de publicar revisamos el boceto contigo y lo ajustamos. Ya publicada, con el mantenimiento mensual nos mandas por WhatsApp los cambios menores (precios, horarios, fotos, promociones) y nosotros los hacemos.",
};

/** Combos: página + otros servicios del catálogo. Sin precios hasta que el dueño los confirme. */
function faqCombo(ejemplo: string): FAQ {
  return {
    pregunta: "¿Puedo contratar varios servicios juntos?",
    respuesta: `Sí. Armamos un combo con lo que tu negocio necesita: página web, Perfil de Google Maps, redes sociales o chatbot de WhatsApp. ${ejemplo} Te lo cotizamos por WhatsApp junto con tu boceto gratis.`,
  };
}

function faqNecesito(cosas: string): FAQ {
  return {
    pregunta: "¿Qué necesito darte?",
    respuesta: `${cosas} Si no tienes buenas fotos, te decimos cómo tomarlas con tu celular. Todo nos lo puedes mandar por WhatsApp.`,
  };
}

// ---------------------------------------------------------------------------
// Páginas
// ---------------------------------------------------------------------------
export const PAGINAS_SEO: PaginaSEO[] = [
  // ======================= SERVICIOS =======================
  {
    slug: "paginas-web-mexico",
    tipo: "servicio",
    menu: "Páginas web",
    titulo: "Páginas web para negocios en México",
    descripcion:
      "Páginas web rápidas y pensadas para celular para negocios de todo México: botón de WhatsApp, mapa y SEO local. Pide tu boceto gratis.",
    antetitulo: "Diseño web para todo México",
    h1: "Páginas web para negocios en *México*",
    intro:
      "Cuando alguien busca lo que vendes, lo primero que hace es sacar el celular. Una página clara, rápida y con tu WhatsApp a un toque convierte esa búsqueda en un mensaje para ti. Te enseñamos un boceto gratis antes de que pagues nada.",
    ejemplo: "web",
    problemasTitulo: "Lo que le pasa a un negocio *sin página*",
    problemas: [
      {
        titulo: "Te buscan y no apareces",
        texto:
          "Si alguien escribe tu giro + el nombre de tu ciudad y no encuentra nada tuyo, se va con el negocio que sí aparece, aunque el tuyo sea mejor.",
      },
      {
        titulo: "Todo depende de tus redes",
        texto:
          "Facebook e Instagram ayudan, pero no son tuyos: el algoritmo decide quién ve tus publicaciones y tus datos importantes se pierden entre posts.",
      },
      {
        titulo: "Contestas lo mismo todo el día",
        texto:
          "¿Dónde están? ¿A qué hora abren? ¿Cuánto cuesta? Una página responde eso antes de que te escriban, y te llegan mensajes de gente más decidida.",
      },
      {
        titulo: "Te ves menos profesional",
        texto:
          "Hoy un cliente nuevo te revisa en internet antes de visitarte. Sin página, compites en desventaja contra quien sí la tiene.",
      },
    ],
    incluyeTitulo: "Qué incluye tu *página*",
    incluye: [
      {
        titulo: "Diseño a la medida",
        texto: "Tus colores, tus fotos y textos escritos para tu negocio. Nada de plantillas genéricas con texto de relleno.",
      },
      {
        titulo: "WhatsApp y llamada a un toque",
        texto: "Botones visibles en todas las secciones para que te escriban o te llamen sin buscar tu número.",
      },
      {
        titulo: "Pensada primero para celular",
        texto: "La mayoría de tus visitas llegan desde el teléfono, así que la diseñamos para verse y cargar bien ahí.",
      },
      {
        titulo: "Mapa y cómo llegar",
        texto: "Tu ubicación con Google Maps para que lleguen sin perderse, con horarios y referencias.",
      },
      {
        titulo: "SEO local",
        texto:
          "Títulos, descripciones y datos estructurados para que Google entienda qué haces y en qué zona trabajas.",
      },
      {
        titulo: "Tu propio link",
        texto: "Publicada en tunegocio.skystudioslabs.com, lista para compartir. Dominio propio .com o .mx disponible como extra.",
      },
    ],
    faqs: [
      {
        pregunta: "¿Cuánto cuesta una página web?",
        respuesta:
          "Tenemos tres paquetes de pago único (Básico, Estándar y Premium) y un mantenimiento mensual opcional. El precio depende de cuántas secciones lleva tu página y de si sumas Google Maps, redes o chatbot; te lo confirmamos por WhatsApp antes de empezar. El boceto es gratis y sin compromiso.",
      },
      faqTiempo,
      faqNecesito(
        "Tu logo (si tienes), fotos de tu negocio y de tus productos o trabajos, la lista de lo que vendes, horarios, dirección y el número de WhatsApp donde quieres recibir mensajes."
      ),
      faqDominio,
      faqCambios,
      faqCombo("Lo más común es página + Google Maps, para que te encuentren en el mapa y te escriban desde tu página."),
      {
        pregunta: "¿Trabajan en todo México?",
        respuesta:
          "Sí. Trabajamos con negocios de cualquier ciudad de México. Todo lo resolvemos por WhatsApp y, si hace falta, por videollamada.",
      },
    ],
    servicio: {
      nombre: "Diseño de páginas web para negocios locales",
      descripcion:
        "Páginas web adaptadas a celular con botón de WhatsApp, mapa de ubicación y SEO local para negocios de todo México.",
    },
    mensajeWhatsApp: "Hola, quiero mi boceto gratis de página web para mi negocio.",
  },
  {
    slug: "google-maps-negocios",
    tipo: "servicio",
    menu: "Google Maps",
    titulo: "Alta y optimización en Google Maps",
    descripcion:
      "Damos de alta y optimizamos tu Perfil de Empresa en Google para que tu negocio aparezca en Google Maps en todo México: fotos, horarios, categorías y reseñas.",
    antetitulo: "Perfil de Empresa en Google",
    h1: "Que te encuentren en *Google Maps*",
    intro:
      "Cuando alguien busca “taller cerca de mí” o “dentista en Monterrey”, Google enseña primero un mapa con unos cuantos negocios. Ahí se decide buena parte de las visitas. Te ayudamos a tener tu ficha completa, verificada y bien configurada para competir por ese lugar.",
    ejemplo: "maps",
    problemasTitulo: "Por qué no te *encuentran*",
    problemas: [
      {
        titulo: "Tu ficha no existe o no está verificada",
        texto: "Sin verificar, Google muestra menos tu negocio y cualquiera puede sugerir cambios a tus datos.",
      },
      {
        titulo: "Datos viejos o incompletos",
        texto: "Un horario equivocado o un teléfono que ya no usas manda clientes a una cortina cerrada o a un número muerto.",
      },
      {
        titulo: "Categoría equivocada",
        texto: "Si tu categoría principal no describe lo que haces, Google no te muestra en las búsquedas que importan.",
      },
      {
        titulo: "Pocas fotos y reseñas sin responder",
        texto: "La gente compara fichas. Una sin fotos ni respuestas transmite abandono, aunque tu servicio sea bueno.",
      },
    ],
    incluyeTitulo: "Qué hacemos en tu *ficha*",
    incluye: [
      {
        titulo: "Alta o recuperación del perfil",
        texto:
          "Creamos tu Perfil de Empresa en Google o reclamamos el que ya existe, y te acompañamos en la verificación que pide Google.",
      },
      {
        titulo: "Categorías y servicios correctos",
        texto: "Elegimos la categoría principal y las secundarias, y damos de alta tus servicios con descripciones claras.",
      },
      {
        titulo: "Datos de contacto completos",
        texto: "Horarios (incluidos días festivos), teléfono, WhatsApp, zona de servicio y link a tu página web.",
      },
      {
        titulo: "Fotos que sí venden",
        texto: "Te decimos qué fotos subir (fachada, interior, equipo, trabajos) para que te reconozcan al llegar.",
      },
      {
        titulo: "Sistema para pedir reseñas",
        texto:
          "Un link directo y un mensaje listo para pedir reseñas a tus clientes satisfechos, más plantillas para responderlas. Nunca reseñas falsas.",
      },
      {
        titulo: "Conexión con tu página",
        texto: "Tu ficha y tu página se refuerzan: mismos datos, mismo nombre y enlaces entre ambas.",
      },
      {
        titulo: "Gestión mensual opcional",
        texto:
          "Si quieres que la sigamos cuidando: horarios al día, fotos y novedades nuevas y ayuda para responder cada reseña.",
      },
    ],
    nota:
      "Nadie puede garantizar el primer lugar en Google Maps; si alguien te lo promete, desconfía. Lo que sí hacemos es dejar tu ficha completa, correcta y activa, que es lo que Google toma en cuenta.",
    faqs: [
      {
        pregunta: "¿Me garantizan salir en primer lugar?",
        respuesta:
          "No, y nadie puede hacerlo honestamente: el orden lo decide Google según la distancia, la relevancia y la reputación de cada negocio. Nosotros trabajamos lo que sí depende de ti: una ficha completa, verificada, con fotos y reseñas reales.",
      },
      {
        pregunta: "¿Cuánto tarda en aparecer mi negocio?",
        respuesta:
          "La verificación la controla Google: puede ser por llamada, mensaje, correo o video y a veces tarda varios días. Nosotros dejamos todo listo de nuestro lado y te avisamos qué sigue en cada paso.",
      },
      {
        pregunta: "¿Qué necesito darte?",
        respuesta:
          "Una cuenta de Google (o la creamos juntos), la dirección exacta, horarios, teléfono, la lista de servicios y fotos de tu negocio. Si atiendes a domicilio, también las colonias o municipios donde das servicio.",
      },
      {
        pregunta: "Ya tengo ficha pero no sé quién la creó, ¿se puede recuperar?",
        respuesta:
          "Normalmente sí. Google tiene un proceso para solicitar la propiedad de una ficha; te guiamos para hacerlo y, ya recuperada, la dejamos al día.",
      },
      {
        pregunta: "¿Viene incluido en algún paquete?",
        respuesta:
          "Sí: los paquetes Estándar y Premium incluyen el alta y optimización en Google Maps junto con tu página. También lo puedes contratar solo, con o sin la gestión mensual; cotízalo por WhatsApp.",
      },
    ],
    servicio: {
      nombre: "Alta y optimización en Google Maps",
      descripcion:
        "Alta, verificación y optimización del Perfil de Empresa en Google para negocios de todo México.",
    },
    mensajeWhatsApp: "Hola, quiero que mi negocio aparezca bien en Google Maps. ¿Me ayudan?",
  },
  {
    slug: "redes-sociales-negocios",
    tipo: "servicio",
    menu: "Redes sociales",
    titulo: "Manejo de redes sociales para negocios locales",
    descripcion:
      "Plan de publicaciones, diseño y textos para Facebook e Instagram de negocios de todo México, enfocados en que te escriban por WhatsApp.",
    antetitulo: "Facebook e Instagram para negocios",
    h1: "Redes sociales para negocios *locales*",
    intro:
      "Publicar por publicar no trae clientes. Te armamos un plan pensado para tu negocio: qué subir, cuándo y con qué mensaje, para que tus redes lleven gente a tu WhatsApp o a tu página.",
    ejemplo: "redes",
    problemasTitulo: "Por qué tus redes *no venden*",
    problemas: [
      {
        titulo: "Publicas cuando te acuerdas",
        texto: "Semanas sin publicar y luego cinco posts en un día. Tus seguidores se olvidan de ti entre una y otra.",
      },
      {
        titulo: "Fotos sin contexto",
        texto: "Una foto bonita sin precio, sin explicación y sin “escríbenos” rara vez se convierte en un mensaje.",
      },
      {
        titulo: "No saben cómo contactarte",
        texto: "Bio vacía, sin link y sin botón de WhatsApp: el interesado tiene que investigar y casi nunca lo hace.",
      },
      {
        titulo: "No te da el tiempo",
        texto: "Atender tu negocio ya es trabajo completo. Las redes terminan siendo lo último de la lista.",
      },
    ],
    incluyeTitulo: "Qué incluye el *plan*",
    incluye: [
      {
        titulo: "Calendario de publicaciones",
        texto: "Un plan mensual con temas, fechas y objetivos: promociones, trabajos terminados, preguntas frecuentes, tu equipo.",
      },
      {
        titulo: "Diseños con tu marca",
        texto: "Publicaciones e historias con tus colores y tipografía para que te reconozcan en el feed.",
      },
      {
        titulo: "Textos que piden acción",
        texto: "Cada publicación cierra con una invitación clara: escríbenos por WhatsApp, aparta tu cita, ven hoy.",
      },
      {
        titulo: "Perfil optimizado",
        texto: "Bio, foto, link, botón de contacto e historias destacadas con lo que tus clientes preguntan.",
      },
      {
        titulo: "Ideas para tu celular",
        texto: "Te decimos qué fotos y videos cortos grabar en tu negocio y cómo, sin equipo profesional.",
      },
      {
        titulo: "Todo conectado",
        texto: "Tus redes, tu página y tu ficha de Google Maps con los mismos datos y enlaces entre sí.",
      },
    ],
    nota:
      "El alcance exacto (número de publicaciones y si publicamos nosotros o te dejamos todo listo) lo definimos contigo según tu plan: [PUBLICACIONES POR MES].",
    faqs: [
      {
        pregunta: "¿Qué redes manejan?",
        respuesta:
          "Principalmente Facebook e Instagram, que es donde más buscan los clientes de negocios locales. Si tu público está en otra red, lo platicamos.",
      },
      {
        pregunta: "¿Cuántas publicaciones hacen al mes?",
        respuesta:
          "Depende del plan que elijas: [PUBLICACIONES POR MES]. Preferimos pocas publicaciones bien pensadas a muchas sin objetivo.",
      },
      {
        pregunta: "¿Incluye anuncios pagados?",
        respuesta:
          "El plan es de contenido orgánico. Si te conviene anunciarte, te asesoramos y lo cotizamos aparte; la inversión en anuncios se paga directo a Meta.",
      },
      {
        pregunta: "¿Tengo que tomar yo las fotos?",
        respuesta:
          "Lo ideal es usar fotos reales de tu negocio, porque generan más confianza. Te damos una lista de qué fotografiar y consejos para hacerlo con tu celular.",
      },
      {
        pregunta: "¿Contestan los mensajes que me llegan?",
        respuesta:
          "La atención de mensajes la puedes automatizar en parte con un chatbot de WhatsApp que responde horarios, precios y ubicación, y te pasa al cliente cuando ya está listo.",
      },
      faqCombo("Por ejemplo, página + Google Maps + un mes de redes para arrancar con todo conectado."),
    ],
    servicio: {
      nombre: "Manejo de redes sociales para negocios locales",
      descripcion:
        "Plan de publicaciones, diseño y textos para Facebook e Instagram de negocios de todo México.",
    },
    mensajeWhatsApp: "Hola, me interesa que me ayuden con las redes sociales de mi negocio.",
  },
  {
    slug: "chatbot-whatsapp",
    tipo: "servicio",
    menu: "Chatbot de WhatsApp",
    titulo: "Chatbot de WhatsApp para negocios",
    descripcion:
      "Chatbot de WhatsApp que responde horarios, precios y ubicación y toma datos para citas o pedidos, también fuera de horario. Para negocios de todo México.",
    antetitulo: "Atención automática en WhatsApp",
    h1: "Chatbot de *WhatsApp* para tu negocio",
    intro:
      "Si tu WhatsApp suena todo el día con las mismas preguntas, un chatbot puede contestarlas al instante, incluso cuando estás atendiendo o ya cerraste. Tú entras cuando el cliente ya está listo para comprar o agendar.",
    ejemplo: "chatbot",
    problemasTitulo: "Lo que se pierde en *WhatsApp*",
    problemas: [
      {
        titulo: "Respuestas tardías",
        texto: "Mientras atiendes, el mensaje espera. Para cuando contestas, el cliente ya le escribió a otro negocio.",
      },
      {
        titulo: "Las mismas preguntas",
        texto: "Horario, ubicación, precios. Escribir lo mismo decenas de veces al día te quita tiempo para lo importante.",
      },
      {
        titulo: "Mensajes fuera de horario",
        texto: "Mucha gente escribe de noche o en fin de semana. Si nadie responde, la intención de compra se enfría.",
      },
      {
        titulo: "Citas y pedidos desordenados",
        texto: "Datos regados entre chats, notas de voz y capturas. Es fácil que se te pase una cita o un pedido.",
      },
    ],
    incluyeTitulo: "Qué hace tu *chatbot*",
    incluye: [
      {
        titulo: "Menú de opciones",
        texto: "El cliente elige: horarios, ubicación, precios, servicios o hablar con una persona.",
      },
      {
        titulo: "Respuestas con tu información",
        texto: "Escribimos las respuestas con los datos reales de tu negocio y en el tono en que tú hablas con tus clientes.",
      },
      {
        titulo: "Datos para citas o pedidos",
        texto: "Pide nombre, día, servicio o producto y te lo deja ordenado para que solo confirmes.",
      },
      {
        titulo: "Paso a una persona",
        texto: "Cuando la conversación lo necesita, el chatbot te avisa y tú continúas desde tu WhatsApp.",
      },
      {
        titulo: "Mensaje fuera de horario",
        texto: "Responde aunque estés cerrado y le dice al cliente cuándo lo vas a atender.",
      },
      {
        titulo: "Ajustes con el uso",
        texto: "Revisamos qué preguntan tus clientes y mejoramos las respuestas con el mantenimiento mensual.",
      },
    ],
    faqs: [
      {
        pregunta: "¿Funciona con mi número actual?",
        respuesta:
          "Depende de cómo uses WhatsApp hoy (app normal o WhatsApp Business) y de la opción que elijamos. Lo revisamos contigo antes de empezar para no perder tus chats ni tu número.",
      },
      {
        pregunta: "¿Va a sonar como robot?",
        respuesta:
          "Escribimos las respuestas en tu tono, cortas y claras. Además, el cliente siempre puede pedir hablar con una persona.",
      },
      {
        pregunta: "¿Puedo seguir contestando yo?",
        respuesta: "Sí. El chatbot resuelve lo repetitivo y tú entras cuando quieras o cuando te avisa que un cliente te necesita.",
      },
      {
        pregunta: "¿Tiene costos extra?",
        respuesta:
          "Sí, y te los decimos desde el principio: el chatbot funciona sobre una plataforma de WhatsApp Business que tiene su propio costo mensual, y Meta (WhatsApp) cobra tarifas por mensajes. Esos pagos los haces tú directo a esos proveedores; nosotros te ayudamos a elegir la opción y la configuramos.",
      },
      {
        pregunta: "¿Viene incluido en algún paquete?",
        respuesta:
          "Sí, el paquete Premium incluye el chatbot de WhatsApp junto con tu página. También lo armamos en combo (por ejemplo, para que un consultorio reciba citas a cualquier hora) o solo, sin página; cotízalo por WhatsApp.",
      },
    ],
    servicio: {
      nombre: "Chatbot de WhatsApp para negocios",
      descripcion:
        "Chatbot de WhatsApp que responde preguntas frecuentes y toma datos para citas o pedidos de negocios de todo México.",
    },
    mensajeWhatsApp: "Hola, me interesa un chatbot de WhatsApp para mi negocio.",
  },

  // ======================= GIROS =======================
  {
    slug: "paginas-web-para-dentistas",
    tipo: "giro",
    menu: "Dentistas",
    titulo: "Páginas web para dentistas en México",
    descripcion:
      "Página web para consultorios dentales en todo México: tratamientos, ubicación, horarios y citas por WhatsApp. Pide tu boceto gratis.",
    antetitulo: "Consultorios dentales",
    h1: "Páginas web para *dentistas*",
    intro:
      "Quien busca dentista quiere confiar antes de llegar: ver el consultorio, saber qué tratamientos haces y agendar sin complicarse. Tu página resuelve eso y manda la cita directo a tu WhatsApp. Antes de pagar nada, te enseñamos un boceto con el nombre y los tratamientos de tu consultorio.",
    ejemplo: "dentista",
    problemasTitulo: "Por qué un paciente *no te elige*",
    problemas: [
      {
        titulo: "No sabe qué tratamientos haces",
        texto: "Limpieza, resinas, ortodoncia, implantes, blanqueamiento… si no lo ve claro en tu perfil, busca a otro.",
      },
      {
        titulo: "No conoce el consultorio ni al doctor",
        texto: "Ir al dentista da nervios. Sin fotos del lugar ni datos del especialista, cuesta dar el primer paso.",
      },
      {
        titulo: "Agendar es complicado",
        texto: "Llama mientras estás con un paciente, nadie contesta y la cita se pierde. Por WhatsApp es más fácil.",
      },
      {
        titulo: "Las clínicas grandes se ven mejor",
        texto: "Tienen página y anuncios. Una página bien hecha te pone al mismo nivel de presentación sin su presupuesto.",
      },
    ],
    incluyeTitulo: "Qué incluye la página de tu *consultorio*",
    incluye: [
      { titulo: "Tratamientos explicados", texto: "Cada tratamiento con una explicación sencilla, para qué sirve y cómo agendar una valoración." },
      {
        titulo: "Perfil del especialista",
        texto: "Tu formación, especialidad y cédula profesional [CÉDULA PROFESIONAL], con foto. Genera confianza desde antes.",
      },
      { titulo: "Fotos del consultorio", texto: "Recepción, sillón y equipo: que el paciente sepa a dónde va." },
      {
        titulo: "Citas por WhatsApp",
        texto: "Un botón con mensaje listo (“Quiero agendar una valoración”) que llega directo a tu teléfono o al de tu asistente.",
      },
      { titulo: "Ubicación y horarios", texto: "Mapa, referencias, estacionamiento y horario de consulta siempre a la vista." },
      { titulo: "Espacio para reseñas reales", texto: "Una sección lista para las opiniones de tus pacientes, tomadas de Google con su permiso." },
    ],
    faqs: [
      faqTiempo,
      faqNecesito(
        "Tu logo, fotos del consultorio y del equipo, la lista de tratamientos, tu cédula profesional, horarios, dirección y el WhatsApp donde quieres recibir citas."
      ),
      faqDominio,
      faqCambios,
      {
        pregunta: "¿Puedo poner precios de tratamientos?",
        respuesta:
          "Tú decides: puedes poner precios “desde”, solo describir los tratamientos o invitar a una valoración. Cuidamos que los textos sean claros y sin prometer resultados.",
      },
      faqCombo("Para consultorios solemos sugerir página + Google Maps + chatbot de WhatsApp para que los pacientes agenden aunque estés en consulta."),
    ],
    servicio: {
      nombre: "Páginas web para dentistas",
      descripcion:
        "Diseño de páginas web para consultorios dentales en todo México con tratamientos, ubicación y citas por WhatsApp.",
    },
    mensajeWhatsApp: "Hola, tengo un consultorio dental y quiero mi boceto gratis de página web.",
  },
  {
    slug: "paginas-web-para-talleres-mecanicos",
    tipo: "giro",
    menu: "Talleres mecánicos",
    titulo: "Páginas web para talleres mecánicos en México",
    descripcion:
      "Página web para talleres mecánicos en todo México: servicios, ubicación y cotizaciones por WhatsApp. Que te encuentren cuando el carro falla.",
    antetitulo: "Talleres y servicio automotriz",
    h1: "Páginas web para talleres *mecánicos*",
    intro:
      "Cuando el carro falla, el cliente busca un taller cerca y de confianza, casi siempre desde el celular y con prisa. Tu página le dice qué arreglas, dónde estás y cómo pedirte una cotización en un mensaje. Te enseñamos gratis un boceto con los servicios reales de tu taller antes de contratar.",
    ejemplo: "taller",
    problemasTitulo: "Por qué no llegan *más carros*",
    problemas: [
      {
        titulo: "Desconfianza",
        texto: "Mucha gente teme que le cobren de más. Si no ve tu taller, tus trabajos ni cómo trabajas, prefiere la agencia.",
      },
      {
        titulo: "No saben qué arreglas",
        texto: "Frenos, afinación, suspensión, eléctrico, clima… si no lo dices claro, el cliente asume que no lo haces.",
      },
      {
        titulo: "No te encuentran cerca",
        texto: "La búsqueda es “taller cerca de mí”. Sin página ni ficha en Google Maps, ni siquiera entras en la lista.",
      },
      {
        titulo: "Cotizar por teléfono quita tiempo",
        texto: "Explicar una falla por llamada es difícil. Con fotos y datos del carro por WhatsApp cotizas más rápido.",
      },
    ],
    incluyeTitulo: "Qué incluye la página de tu *taller*",
    incluye: [
      { titulo: "Servicios claros", texto: "Lista de servicios con una explicación corta de cada uno y las marcas o tipos de vehículo que atiendes." },
      { titulo: "Galería de trabajos", texto: "Fotos de tu taller y de trabajos terminados: la mejor prueba de que sabes lo que haces." },
      {
        titulo: "Cotiza por WhatsApp",
        texto: "Un botón con mensaje listo para que el cliente mande marca, modelo, año y la falla, con fotos si quiere.",
      },
      { titulo: "Ubicación y horario", texto: "Mapa, cómo llegar y horario de recepción de vehículos siempre a la vista." },
      { titulo: "Tu garantía por escrito", texto: "Una sección con las condiciones de garantía de tu trabajo: [TU GARANTÍA]." },
      { titulo: "Espacio para reseñas reales", texto: "Las opiniones de tus clientes, tomadas de Google con su permiso, para quitar la desconfianza." },
    ],
    faqs: [
      faqTiempo,
      faqNecesito(
        "Fotos de tu taller y de trabajos terminados, la lista de servicios, las marcas que atiendes, horarios, dirección y el WhatsApp donde quieres recibir cotizaciones."
      ),
      faqDominio,
      faqCambios,
      {
        pregunta: "¿Puedo mostrar precios?",
        respuesta:
          "Sí. Puedes poner precios de servicios comunes, como cambio de aceite o afinación, y para lo demás pedir que te manden la falla por WhatsApp para cotizar.",
      },
      faqCombo("Para talleres lo que más sirve es página + Google Maps, para aparecer cuando alguien busca “taller cerca de mí”."),
    ],
    servicio: {
      nombre: "Páginas web para talleres mecánicos",
      descripcion:
        "Diseño de páginas web para talleres mecánicos en todo México con servicios, galería y cotizaciones por WhatsApp.",
    },
    mensajeWhatsApp: "Hola, tengo un taller mecánico y quiero mi boceto gratis de página web.",
  },
  {
    slug: "paginas-web-para-barberias",
    tipo: "giro",
    menu: "Barberías",
    titulo: "Páginas web para barberías en México",
    descripcion:
      "Página web para barberías en todo México: cortes, precios, galería y citas por WhatsApp. Llena tu agenda y pide tu boceto gratis.",
    antetitulo: "Barberías y estéticas",
    h1: "Páginas web para *barberías*",
    intro:
      "En una barbería el cliente compra con los ojos: quiere ver cortes, saber cuánto cuesta y apartar su lugar sin esperar. Tu página muestra tu estilo y manda las citas directo a tu WhatsApp. Te enseñamos gratis un boceto con el nombre y los servicios de tu barbería antes de contratar.",
    ejemplo: "barberia",
    problemasTitulo: "Por qué tu agenda *tiene huecos*",
    problemas: [
      {
        titulo: "Tu trabajo se pierde en Instagram",
        texto: "Tus mejores cortes quedan enterrados entre historias y memes. Quien te busca no los encuentra rápido.",
      },
      {
        titulo: "Nadie encuentra tus precios",
        texto: "Si para saber cuánto cuesta un corte hay que preguntar, muchos ni preguntan y se van con quien sí lo publica.",
      },
      {
        titulo: "Citas por DM que se pierden",
        texto: "Mensajes en tres apps distintas, horarios que se cruzan y clientes que no llegan porque nadie confirmó.",
      },
      {
        titulo: "Clientes de paso",
        texto: "Llegan una vez y no regresan porque no se acuerdan de tu nombre ni tienen cómo apartar la siguiente cita.",
      },
    ],
    incluyeTitulo: "Qué incluye la página de tu *barbería*",
    incluye: [
      { titulo: "Galería de cortes", texto: "Tus mejores trabajos en grande: fades, barbas, diseños. Lo que te diferencia." },
      { titulo: "Servicios con precio", texto: "Corte, barba, combos y extras con precio claro, para que el cliente llegue decidido." },
      { titulo: "Aparta tu cita", texto: "Botón de WhatsApp con mensaje listo (servicio y horario) o enlace a tu app de citas si ya usas una." },
      { titulo: "Tu equipo", texto: "Cada barbero con foto y especialidad, para que el cliente pida con quién quiere." },
      { titulo: "Ubicación y horarios", texto: "Mapa, horario y si atiendes con cita o por turno." },
      { titulo: "Conectada a tu Instagram", texto: "Enlaces a tus redes para que te sigan y vean lo nuevo." },
    ],
    faqs: [
      faqTiempo,
      faqNecesito(
        "Fotos de tus cortes y del local, la lista de servicios con precios, los nombres de tus barberos, horarios, dirección y el WhatsApp donde quieres recibir citas."
      ),
      faqDominio,
      faqCambios,
      {
        pregunta: "¿Se puede conectar con una app de citas?",
        respuesta:
          "Sí. Si ya usas una app de citas, ponemos el botón para agendar ahí. Si no, la cita llega a tu WhatsApp, y con un chatbot puedes automatizar parte de las respuestas.",
      },
      faqCombo("Para barberías solemos sugerir página + Google Maps + un mes de redes para mostrar tus cortes donde te buscan."),
    ],
    servicio: {
      nombre: "Páginas web para barberías",
      descripcion:
        "Diseño de páginas web para barberías en todo México con galería de cortes, precios y citas por WhatsApp.",
    },
    mensajeWhatsApp: "Hola, tengo una barbería y quiero mi boceto gratis de página web.",
  },
  {
    slug: "paginas-web-para-restaurantes",
    tipo: "giro",
    menu: "Restaurantes",
    titulo: "Páginas web para restaurantes en México",
    descripcion:
      "Página web para restaurantes, fondas y cafeterías en todo México: menú digital con QR, ubicación, horarios y pedidos por WhatsApp.",
    antetitulo: "Restaurantes, fondas y cafeterías",
    h1: "Páginas web para *restaurantes*",
    intro:
      "Antes de elegir dónde comer, la gente revisa el menú, los precios y las fotos desde el celular. Tu página les enseña todo eso, con un menú fácil de actualizar y pedidos directos a tu WhatsApp, sin pagar comisión por cada pedido que llega por ahí.",
    ejemplo: "restaurante",
    problemasTitulo: "Por qué se van a *otro lado*",
    problemas: [
      {
        titulo: "Menú en foto borrosa o PDF",
        texto: "Hacer zoom a una foto del menú en el celular es incómodo. Muchos se rinden y eligen otro lugar.",
      },
      {
        titulo: "Dependes de las apps de reparto",
        texto: "Son útiles, pero cobran comisión por pedido. Tus clientes frecuentes podrían pedirte directo.",
      },
      {
        titulo: "Horarios equivocados en internet",
        texto: "Si Google dice que estás abierto y llegan con la cortina abajo, no regresan y te dejan mala reseña.",
      },
      {
        titulo: "Dudas sin respuesta",
        texto: "¿Hay estacionamiento? ¿Aceptan tarjeta? ¿Se puede reservar? Si no lo encuentran, eligen lo seguro.",
      },
    ],
    incluyeTitulo: "Qué incluye la página de tu *restaurante*",
    incluye: [
      { titulo: "Menú digital con QR", texto: "Menú fácil de leer en el celular, con un código QR para tus mesas (paquete Premium)." },
      { titulo: "Fotos de tus platillos", texto: "Tus platillos estrella en grande, que antojen desde la pantalla." },
      { titulo: "Pedidos y reservas por WhatsApp", texto: "Botón con mensaje listo para pedir para llevar o reservar mesa." },
      { titulo: "Horarios y ubicación", texto: "Mapa, horarios, estacionamiento y formas de pago siempre correctos." },
      { titulo: "Promos y especiales", texto: "Un espacio para el platillo del día o las promociones de la semana." },
      { titulo: "Conectada a Google Maps", texto: "Mismos datos en tu página y tu ficha para que Google te muestre bien." },
    ],
    faqs: [
      faqTiempo,
      faqNecesito(
        "Tu menú actual (aunque sea en foto), fotos de tus platillos y del lugar, horarios, dirección, formas de pago y el WhatsApp donde quieres recibir pedidos."
      ),
      faqDominio,
      faqCambios,
      {
        pregunta: "¿El menú con QR está incluido?",
        respuesta:
          "El menú digital con código QR viene en el paquete Premium. Con el mantenimiento mensual actualizamos precios y platillos cuando nos lo pidas por WhatsApp.",
      },
      faqCombo("Para restaurantes funciona bien página con menú + Google Maps, para que los horarios y el menú estén correctos en los dos lados."),
    ],
    servicio: {
      nombre: "Páginas web para restaurantes",
      descripcion:
        "Diseño de páginas web para restaurantes en todo México con menú digital, código QR y pedidos por WhatsApp.",
    },
    mensajeWhatsApp: "Hola, tengo un restaurante y quiero mi boceto gratis de página web.",
  },
];

/** Rutas públicas de las páginas SEO, ej. "/paginas-web-mexico". */
export const RUTAS_SEO: string[] = PAGINAS_SEO.map((p) => `/${p.slug}`);

export const PAGINAS_SERVICIO = PAGINAS_SEO.filter((p) => p.tipo === "servicio");
export const PAGINAS_GIRO = PAGINAS_SEO.filter((p) => p.tipo === "giro");

export function obtenerPagina(slug: string): PaginaSEO {
  const p = PAGINAS_SEO.find((x) => x.slug === slug);
  if (!p) throw new Error(`Página SEO no encontrada: ${slug}`);
  return p;
}

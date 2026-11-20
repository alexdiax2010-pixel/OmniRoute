import type { ReactNode } from "react";
import type { VarianteEjemplo } from "@/lib/seo/paginas";
import s from "./seo.module.css";

/**
 * Maqueta visual (SVG) de cómo podría verse la página de un giro. Siempre rotulada
 * "Ejemplo de diseño": los nombres de negocio son ficticios y no representan clientes reales.
 * Tipografía: el SVG hereda var(--fs-title) / var(--fs-body) vía clases (unidades del viewBox).
 */

type TemaPagina = {
  nombre: string;
  lema: [string, string];
  cta: string;
  tarjetas: [string, string, string];
  fondo: string;
  texto: string;
  tenue: string;
  acento: string;
  textoCta: string;
  tarjeta: string;
  icono: (color: string) => ReactNode;
  descripcion: string;
};

const iconoDiente = (c: string) => (
  <path
    d="M14 6c-5 0-8 4-8 9 0 6 3 9 4 15 1 6 2 12 5 12s3-8 5-12c1-2 2-2 4-2s3 0 4 2c2 4 2 12 5 12s4-6 5-12c1-6 4-9 4-15 0-5-3-9-8-9-4 0-6 2-10 2s-6-2-10-2z"
    fill={c}
  />
);
const iconoLlave = (c: string) => (
  <path d="M31 5a11 11 0 0 0-10 15L6 35a4.2 4.2 0 0 0 6 6l15-15a11 11 0 0 0 15-10l-7 6-6-2-2-6 7-7c-1 0-2-2-3-2z" fill={c} />
);
const iconoTijeras = (c: string) => (
  <g fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round">
    <circle cx="13" cy="36" r="6" />
    <circle cx="35" cy="36" r="6" />
    <path d="M17 31 38 6M31 31 10 6" />
  </g>
);
const iconoPlato = (c: string) => (
  <g fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round">
    <circle cx="24" cy="24" r="14" />
    <circle cx="24" cy="24" r="8" />
    <path d="M4 6v12M2 6v8a2 2 0 0 0 4 0V6M4 18v24M44 6c-3 2-4 8-4 14h4v22" />
  </g>
);
const iconoTienda = (c: string) => (
  <g fill="none" stroke={c} strokeWidth="3.5" strokeLinejoin="round">
    <path d="M6 18 10 6h28l4 12" />
    <path d="M6 18c0 4 3 6 6 6s6-2 6-6c0 4 3 6 6 6s6-2 6-6c0 4 3 6 6 6s6-2 6-6" />
    <path d="M9 24v18h30V24M20 42V31h8v11" />
  </g>
);

const PAGINAS: Record<"web" | "dentista" | "taller" | "barberia" | "restaurante", TemaPagina> = {
  web: {
    nombre: "Tu Negocio",
    lema: ["Tu negocio", "en línea"],
    cta: "Escríbenos",
    tarjetas: ["Servicios", "Galería", "Ubicación"],
    fondo: "#0d0d0f",
    texto: "#f4f1ec",
    tenue: "#3a3a42",
    acento: "#ff6a24",
    textoCta: "#140700",
    tarjeta: "#18181c",
    icono: iconoTienda,
    descripcion: "página de inicio de un negocio local con botón de WhatsApp, servicios, galería y ubicación",
  },
  dentista: {
    nombre: "Dental Sonrisa",
    lema: ["Sonríe sin", "miedo"],
    cta: "Agenda tu cita",
    tarjetas: ["Limpieza", "Ortodoncia", "Blanqueamiento"],
    fondo: "#f3f8fb",
    texto: "#0e2a3a",
    tenue: "#c9dae4",
    acento: "#0f9488",
    textoCta: "#ffffff",
    tarjeta: "#ffffff",
    icono: iconoDiente,
    descripcion: "página de un consultorio dental con tratamientos y botón para agendar cita por WhatsApp",
  },
  taller: {
    nombre: "Taller El Pistón",
    lema: ["Tu carro en", "buenas manos"],
    cta: "Cotiza por WhatsApp",
    tarjetas: ["Frenos", "Afinación", "Suspensión"],
    fondo: "#111316",
    texto: "#f4f1ec",
    tenue: "#2e3238",
    acento: "#f59e0b",
    textoCta: "#1a1000",
    tarjeta: "#1b1e23",
    icono: iconoLlave,
    descripcion: "página de un taller mecánico con servicios y botón para cotizar por WhatsApp",
  },
  barberia: {
    nombre: "Barbería La Navaja",
    lema: ["Cortes con", "estilo"],
    cta: "Aparta tu lugar",
    tarjetas: ["Corte", "Barba", "Combo"],
    fondo: "#17120e",
    texto: "#f5ead8",
    tenue: "#3a2f25",
    acento: "#d4a24c",
    textoCta: "#1a1206",
    tarjeta: "#211a14",
    icono: iconoTijeras,
    descripcion: "página de una barbería con servicios y precios y botón para apartar cita por WhatsApp",
  },
  restaurante: {
    nombre: "Fonda Los Arcos",
    lema: ["Sazón de", "casa"],
    cta: "Pide por WhatsApp",
    tarjetas: ["Desayunos", "Comida", "Para llevar"],
    fondo: "#fff6ea",
    texto: "#2b1607",
    tenue: "#ecd9c2",
    acento: "#c2410c",
    textoCta: "#ffffff",
    tarjeta: "#ffffff",
    icono: iconoPlato,
    descripcion: "página de un restaurante con menú, pedidos por WhatsApp y horarios",
  },
};

const ETIQUETA: Record<VarianteEjemplo, string> = {
  web: "Página web para un negocio local",
  maps: "Ficha optimizada en Google Maps",
  redes: "Perfil de Instagram con plan de publicaciones",
  chatbot: "Chatbot de WhatsApp respondiendo a un cliente",
  dentista: "Página para un consultorio dental",
  taller: "Página para un taller mecánico",
  barberia: "Página para una barbería",
  restaurante: "Página para un restaurante",
};

function BarraNavegador({ url }: { url: string }) {
  return (
    <g>
      <rect x="0" y="0" width="800" height="52" fill="#1c1c20" />
      <circle cx="26" cy="26" r="6" fill="#ff5f57" />
      <circle cx="46" cy="26" r="6" fill="#febc2e" />
      <circle cx="66" cy="26" r="6" fill="#28c840" />
      <rect x="100" y="11" width="440" height="30" rx="15" fill="#2a2a30" />
      <text className={s.svgTexto} x="120" y="32" fill="#a8a39b">
        {url}
      </text>
    </g>
  );
}

function MaquetaPagina({ t }: { t: TemaPagina }) {
  return (
    <>
      <rect x="0" y="0" width="800" height="560" fill={t.fondo} />
      <BarraNavegador url="tunegocio.skystudioslabs.com" />
      {/* nav */}
      <circle cx="56" cy="94" r="16" fill={t.acento} />
      <text className={s.svgTexto} x="84" y="100" fill={t.texto} fontWeight="700">
        {t.nombre}
      </text>
      {[520, 596, 672].map((x) => (
        <rect key={x} x={x} y="90" width="56" height="8" rx="4" fill={t.tenue} />
      ))}
      {/* hero */}
      <text className={s.svgTitulo} x="40" y="196" fill={t.texto}>
        {t.lema[0]}
      </text>
      <text className={s.svgTitulo} x="40" y="246" fill={t.acento}>
        {t.lema[1]}
      </text>
      <rect x="40" y="270" width="300" height="10" rx="5" fill={t.tenue} />
      <rect x="40" y="290" width="230" height="10" rx="5" fill={t.tenue} />
      <rect x="40" y="318" width="260" height="52" rx="26" fill={t.acento} />
      <text className={s.svgTexto} x="170" y="350" textAnchor="middle" fill={t.textoCta} fontWeight="700">
        {t.cta}
      </text>
      <circle cx="610" cy="226" r="122" fill={t.acento} opacity="0.12" />
      <circle cx="610" cy="226" r="86" fill={t.acento} opacity="0.2" />
      <g transform="translate(548 164) scale(2.6)">{t.icono(t.acento)}</g>
      {/* tarjetas */}
      {t.tarjetas.map((label, i) => {
        const x = 40 + i * 248;
        return (
          <g key={label}>
            <rect x={x} y="404" width="224" height="128" rx="14" fill={t.tarjeta} stroke={t.tenue} />
            <rect x={x + 20} y="424" width="40" height="40" rx="10" fill={t.acento} opacity="0.25" />
            <text className={s.svgTexto} x={x + 20} y="494" fill={t.texto} fontWeight="700">
              {label}
            </text>
            <rect x={x + 20} y="508" width="140" height="8" rx="4" fill={t.tenue} />
          </g>
        );
      })}
    </>
  );
}

function estrella(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

function MaquetaMaps() {
  return (
    <>
      <rect x="0" y="0" width="800" height="560" fill="#18202b" />
      <BarraNavegador url="google.com/maps · tu negocio" />
      <rect x="560" y="70" width="200" height="140" rx="10" fill="#1d3a2b" />
      <path d="M0 260 C 200 230, 380 330, 800 280" stroke="#1f3f66" strokeWidth="26" fill="none" />
      {[
        "M0 130 H800",
        "M0 420 H800",
        "M140 52 V560",
        "M420 52 V560",
        "M660 52 V560",
        "M0 520 L800 180",
      ].map((d) => (
        <path key={d} d={d} stroke="#2a3646" strokeWidth="14" fill="none" />
      ))}
      {[
        [230, 170],
        [700, 380],
        [330, 470],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="#5b6778" />
      ))}
      <g transform="translate(560 120)">
        <path d="M0 0c-26 0-44 20-44 42 0 30 44 70 44 70s44-40 44-70C44 20 26 0 0 0z" fill="#ff4a1c" />
        <circle cx="0" cy="42" r="15" fill="#140700" />
      </g>
      <rect x="40" y="290" width="470" height="240" rx="18" fill="#141417" stroke="#26262b" />
      <text className={s.svgTitulo} x="68" y="350" fill="#f4f1ec">
        Tu Negocio
      </text>
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon key={i} points={estrella(78 + i * 26, 380, 10)} fill="#fbbc04" />
      ))}
      <text className={s.svgTexto} x="68" y="420" fill="#a8a39b">
        Fotos · Horarios · Servicios
      </text>
      {["Cómo llegar", "Llamar", "WhatsApp"].map((label, i) => (
        <g key={label}>
          <rect
            x={68 + i * 146}
            y="448"
            width="134"
            height="48"
            rx="24"
            fill={i === 2 ? "#25d366" : "#1f2a37"}
            stroke={i === 2 ? "none" : "#3a4a5e"}
          />
          <text
            className={s.svgTexto}
            x={68 + i * 146 + 67}
            y="478"
            textAnchor="middle"
            fill={i === 2 ? "#04210f" : "#cfe0ff"}
            fontWeight="700"
          >
            {label}
          </text>
        </g>
      ))}
    </>
  );
}

function MaquetaRedes() {
  const tiles = [
    { t: "Promo", a: "#ff4a1c", b: "#ff8a2a" },
    { t: "Nuevo", a: "#2f6bff", b: "#7fa6ff" },
    { t: "Tips", a: "#16a34a", b: "#4ade80" },
    { t: "Equipo", a: "#9333ea", b: "#c084fc" },
    { t: "Hoy", a: "#e11d48", b: "#fb7185" },
    { t: "Antes", a: "#0891b2", b: "#67e8f9" },
  ];
  return (
    <>
      <rect x="0" y="0" width="800" height="560" fill="#0d0d0f" />
      <BarraNavegador url="instagram.com/tunegocio" />
      <defs>
        <linearGradient id="ex-redes-anillo" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ff8a2a" />
          <stop offset="0.5" stopColor="#e1306c" />
          <stop offset="1" stopColor="#833ab4" />
        </linearGradient>
        {tiles.map((tile, i) => (
          <linearGradient key={tile.t} id={`ex-redes-${i}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={tile.a} />
            <stop offset="1" stopColor={tile.b} />
          </linearGradient>
        ))}
      </defs>
      <circle cx="90" cy="124" r="46" fill="none" stroke="url(#ex-redes-anillo)" strokeWidth="5" />
      <circle cx="90" cy="124" r="38" fill="#ff4a1c" opacity="0.85" />
      <text className={s.svgTexto} x="160" y="106" fill="#f4f1ec" fontWeight="700">
        Tu Negocio
      </text>
      <rect x="160" y="120" width="260" height="9" rx="4.5" fill="#3a3a42" />
      <rect x="160" y="138" width="190" height="9" rx="4.5" fill="#3a3a42" />
      <rect x="160" y="158" width="160" height="38" rx="19" fill="#25d366" />
      <text className={s.svgTexto} x="240" y="183" textAnchor="middle" fill="#04210f" fontWeight="700">
        WhatsApp
      </text>
      {tiles.map((tile, i) => {
        const x = 40 + (i % 3) * 244;
        const y = 222 + Math.floor(i / 3) * 168;
        return (
          <g key={tile.t}>
            <rect x={x} y={y} width="232" height="156" rx="10" fill={`url(#ex-redes-${i})`} />
            <text className={s.svgTitulo} x={x + 116} y={y + 92} textAnchor="middle" fill="#ffffff">
              {tile.t}
            </text>
          </g>
        );
      })}
    </>
  );
}

function MaquetaChatbot() {
  const verde = "#005c4b";
  const gris = "#1f2c34";
  return (
    <>
      <rect x="0" y="0" width="800" height="560" fill="#0d0d0f" />
      <rect x="60" y="20" width="320" height="520" rx="36" fill="#0b141a" stroke="#26262b" strokeWidth="2" />
      <path d="M60 56a36 36 0 0 1 36-36h248a36 36 0 0 1 36 36v34H60z" fill={gris} />
      <circle cx="104" cy="58" r="18" fill="#ff4a1c" />
      <text className={s.svgTexto} x="132" y="56" fill="#e9edef" fontWeight="700">
        Tu Negocio
      </text>
      <text className={s.svgTexto} x="132" y="78" fill="#8696a0">
        en línea
      </text>

      <rect x="104" y="108" width="256" height="44" rx="12" fill={verde} />
      <text className={s.svgTexto} x="118" y="136" fill="#e9edef">
        Hola, ¿a qué hora abren?
      </text>

      <rect x="76" y="166" width="250" height="128" rx="12" fill={gris} />
      {["¡Hola! Elige una opción:", "1  Horarios", "2  Ubicación", "3  Agendar cita"].map((l, i) => (
        <text key={l} className={s.svgTexto} x="90" y={194 + i * 26} fill="#e9edef" fontWeight={i === 0 ? "700" : "400"}>
          {l}
        </text>
      ))}

      <rect x="310" y="308" width="50" height="44" rx="12" fill={verde} />
      <text className={s.svgTexto} x="335" y="336" textAnchor="middle" fill="#e9edef">
        3
      </text>

      <rect x="76" y="366" width="230" height="74" rx="12" fill={gris} />
      <text className={s.svgTexto} x="90" y="394" fill="#e9edef">
        Perfecto. ¿Qué día
      </text>
      <text className={s.svgTexto} x="90" y="420" fill="#e9edef">
        te acomoda?
      </text>

      <rect x="76" y="484" width="232" height="40" rx="20" fill={gris} />
      <circle cx="338" cy="504" r="20" fill="#00a884" />
      <path d="M330 496 348 504 330 512 333 504z" fill="#0b141a" />

      <text className={s.svgTitulo} x="430" y="190" fill="#f4f1ec">
        Responde
      </text>
      <text className={s.svgTitulo} x="430" y="240" fill="#ff6a24">
        al instante
      </text>
      {["Horarios y ubicación", "Datos para citas", "Te pasa al cliente"].map((l, i) => (
        <g key={l}>
          <circle cx="446" cy={300 + i * 52} r="14" fill="#25d366" />
          <path
            d={`M439 ${300 + i * 52} l5 5 9-10`}
            stroke="#04210f"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text className={s.svgTexto} x="472" y={306 + i * 52} fill="#f4f1ec">
            {l}
          </text>
        </g>
      ))}
    </>
  );
}

export function ExampleShowcase({ variante }: { variante: VarianteEjemplo }) {
  const etiqueta = ETIQUETA[variante];
  const descripcion =
    variante === "maps"
      ? "ficha de negocio en Google Maps con fotos, horarios y botones para llegar, llamar y escribir por WhatsApp"
      : variante === "redes"
        ? "perfil de Instagram con botón de WhatsApp y publicaciones con diseño de marca"
        : variante === "chatbot"
          ? "conversación de WhatsApp donde el chatbot ofrece horarios, ubicación y agendar cita"
          : PAGINAS[variante].descripcion;
  const clip = `ex-clip-${variante}`;

  return (
    <figure className={s.ejemplo}>
      <div className={s.ejemploMarco}>
        <span className={s.ejemploSello}>Ejemplo de diseño</span>
        <svg viewBox="0 0 800 560" role="img" aria-label={`Ejemplo de diseño: ${descripcion}`} className={s.ejemploSvg}>
          <defs>
            <clipPath id={clip}>
              <rect x="0" y="0" width="800" height="560" rx="18" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clip})`}>
            {variante === "maps" ? (
              <MaquetaMaps />
            ) : variante === "redes" ? (
              <MaquetaRedes />
            ) : variante === "chatbot" ? (
              <MaquetaChatbot />
            ) : (
              <MaquetaPagina t={PAGINAS[variante]} />
            )}
          </g>
        </svg>
      </div>
      <figcaption className={`muted ${s.ejemploPie}`}>
        <strong>Ejemplo de diseño:</strong> {etiqueta}. El negocio es ficticio; tu boceto lo hacemos con tu
        nombre, tus fotos y tus datos reales.
      </figcaption>
    </figure>
  );
}

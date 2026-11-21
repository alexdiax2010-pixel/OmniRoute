/**
 * Prototipos de paleta. Cada tema redefine los tokens de color (--c-*) y los colores
 * puntuales de las escenas (--k-*, que por defecto valen el color original).
 * Paletas tomadas de la referencia del cliente:
 *   02 Black + Silver: #0D0D0D #2B2B2B #8E8E8E #E6E6E6
 *   05 Navy + White:   #0F1E3A #1E2F4F #A7B6D0 #FFFFFF
 */
export type Tema = {
  slug: "negro-plata" | "azul-marino";
  nombre: string;
  muestras: string[];
  tokens: Record<string, string>;
};

const OSCUROS_NEUTROS = ["0e0e10", "0f0f12", "10131c", "111114", "121215", "161616", "17120f", "18181c", "1a1513", "1b1b20", "1d1d22", "0a1020", "0b1226", "101a33"];
const MEDIOS_NEUTROS = ["26262b", "2a2a31", "2b2b31", "2c2c33", "1f2a44"];
const CLAROS_NEUTROS = ["34343b", "3a3a42", "2c3c66"];

function grupo(claves: string[], valor: string): Record<string, string> {
  return Object.fromEntries(claves.map((k) => [`--k-${k}`, valor]));
}

export const TEMAS: Tema[] = [
  {
    slug: "negro-plata",
    nombre: "Negro + Plata",
    muestras: ["#0D0D0D", "#2B2B2B", "#8E8E8E", "#E6E6E6"],
    tokens: {
      "--c-bg": "#0D0D0D",
      "--c-bg-2": "#121212",
      "--c-surface": "#1A1A1A",
      "--c-line": "#2B2B2B",
      "--c-text": "#E6E6E6",
      "--c-muted": "#8E8E8E",
      "--c-ember": "#F2F2F2",
      "--c-orange": "#8E8E8E",
      "--c-electric": "#BDBDBD",
      "--c-electric-2": "#E6E6E6",
      "--glow-ember": "radial-gradient(closest-side, rgba(230,230,230,0.22), rgba(142,142,142,0.08) 55%, transparent 100%)",
      "--glow-electric": "radial-gradient(closest-side, rgba(190,190,190,0.2), rgba(142,142,142,0.06) 55%, transparent 100%)",
      "--k-140700": "#0D0D0D",
      "--k-f4f1ec": "#E6E6E6",
      "--k-rgb-255-74-28": "200,200,200",
      "--k-rgb-255-138-42": "142,142,142",
      "--k-rgb-47-107-255": "190,190,190",
      "--k-rgb-127-166-255": "230,230,230",
      "--k-rgb-255-106-32": "220,220,220",
      "--k-rgb-255-170-90": "220,220,220",
      "--k-rgb-255-180-90": "220,220,220",
      "--k-rgb-255-220-160": "235,235,235",
      "--k-fff6e8": "#FFFFFF",
      "--k-ffe0a3": "#F0F0F0",
      "--k-ffd08a": "#E6E6E6",
      "--k-ffb347": "#BDBDBD",
      "--k-8a3a06": "#4A4A4A",
      "--k-7a1d08": "#2B2B2B",
      "--k-1f4fd1": "#8E8E8E",
      "--k-3f5fb0": "#8E8E8E",
      "--k-0f2b22": "#262626",
      ...grupo(OSCUROS_NEUTROS, "#161616"),
      ...grupo(MEDIOS_NEUTROS, "#2B2B2B"),
      ...grupo(CLAROS_NEUTROS, "#3A3A3A"),
    },
  },
  {
    slug: "azul-marino",
    nombre: "Azul marino + Blanco",
    muestras: ["#0F1E3A", "#1E2F4F", "#A7B6D0", "#FFFFFF"],
    tokens: {
      "--c-bg": "#0F1E3A",
      "--c-bg-2": "#13244A",
      "--c-surface": "#1E2F4F",
      "--c-line": "#2E4268",
      "--c-text": "#FFFFFF",
      "--c-muted": "#A7B6D0",
      "--c-ember": "#DCE4F1",
      "--c-orange": "#A7B6D0",
      "--c-electric": "#A7B6D0",
      "--c-electric-2": "#FFFFFF",
      "--glow-ember": "radial-gradient(closest-side, rgba(167,182,208,0.28), rgba(167,182,208,0.08) 55%, transparent 100%)",
      "--glow-electric": "radial-gradient(closest-side, rgba(255,255,255,0.16), rgba(167,182,208,0.06) 55%, transparent 100%)",
      "--k-140700": "#0F1E3A",
      "--k-f4f1ec": "#FFFFFF",
      "--k-rgb-255-74-28": "167,182,208",
      "--k-rgb-255-138-42": "167,182,208",
      "--k-rgb-47-107-255": "167,182,208",
      "--k-rgb-127-166-255": "255,255,255",
      "--k-rgb-255-106-32": "201,212,230",
      "--k-rgb-255-170-90": "201,212,230",
      "--k-rgb-255-180-90": "201,212,230",
      "--k-rgb-255-220-160": "232,238,247",
      "--k-rgb-13-13-15": "15,30,58",
      "--k-rgb-20-20-23": "15,30,58",
      "--k-rgb-5-5-5": "15,30,58",
      "--k-rgb-38-38-43": "30,47,79",
      "--k-fff6e8": "#FFFFFF",
      "--k-ffe0a3": "#E8EEF7",
      "--k-ffd08a": "#C9D4E6",
      "--k-ffb347": "#A7B6D0",
      "--k-8a3a06": "#2E4268",
      "--k-7a1d08": "#1E2F4F",
      "--k-1f4fd1": "#A7B6D0",
      "--k-3f5fb0": "#A7B6D0",
      "--k-0f2b22": "#1E2F4F",
      "--k-141417": "#1E2F4F",
      ...grupo(OSCUROS_NEUTROS, "#13244A"),
      ...grupo(MEDIOS_NEUTROS, "#2E4268"),
      ...grupo(CLAROS_NEUTROS, "#3B5180"),
    },
  },
];

export function obtenerTema(slug: string): Tema | undefined {
  return TEMAS.find((t) => t.slug === slug);
}

/** CSS que aplica el tema a todo el documento (más específico que :root de globals.css). */
export function cssTema(t: Tema): string {
  const decl = Object.entries(t.tokens).map(([k, v]) => `${k}:${v};`).join("");
  return `html:root{${decl}}`;
}

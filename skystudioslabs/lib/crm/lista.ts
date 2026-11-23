import { ETAPAS, type Etapa, type Prospecto } from "@/lib/types";
import { plano } from "./texto";

/** Filtro y orden de la lista del CRM (puro). */
export const ORDENES = ["puntaje", "nombre", "etapa", "seguimiento", "colonia"] as const;
export type Orden = (typeof ORDENES)[number];

export type FiltrosLista = {
  orden: Orden;
  dir: "asc" | "desc";
  etapa: Etapa | null;
  top10: boolean;
  q: string;
  /** giro / categoría exactos (como salen en los selectores); "" = todos */
  giro: string;
  categoria: string;
  /** solo seguimientos de hoy o vencidos (excluye Ganado/Perdido) */
  pendientes: boolean;
};

export function leerFiltros(sp: Record<string, string | string[] | undefined>): FiltrosLista {
  const uno = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const orden = (ORDENES as readonly string[]).includes(uno("orden")) ? (uno("orden") as Orden) : "puntaje";
  const dirDef = orden === "puntaje" ? "desc" : "asc";
  const dir = uno("dir") === "asc" || uno("dir") === "desc" ? (uno("dir") as "asc" | "desc") : dirDef;
  const etapa = (ETAPAS as readonly string[]).includes(uno("etapa")) ? (uno("etapa") as Etapa) : null;
  return {
    orden,
    dir,
    etapa,
    top10: uno("top10") === "1",
    q: uno("q").slice(0, 100),
    giro: uno("giro").slice(0, 120),
    categoria: uno("categoria").slice(0, 120),
    pendientes: uno("pendientes") === "1",
  };
}

type ParaLista = Pick<Prospecto, "nombre" | "giro" | "colonia" | "etapa" | "puntaje" | "seguimiento" | "top10"> & Partial<Pick<Prospecto, "categoria">>;

/** `hoy` (YYYY-MM-DD) solo hace falta para el filtro de pendientes. */
export function filtrarYOrdenar<T extends ParaLista>(lista: T[], f: FiltrosLista, hoy = ""): T[] {
  const q = plano(f.q);
  const r = lista.filter(
    (p) =>
      (!f.etapa || p.etapa === f.etapa) &&
      (!f.top10 || p.top10) &&
      (!f.giro || p.giro === f.giro) &&
      (!f.categoria || (p.categoria ?? "") === f.categoria) &&
      (!f.pendientes || (Boolean(p.seguimiento) && p.seguimiento! <= hoy && p.etapa !== "Ganado" && p.etapa !== "Perdido")) &&
      (!q || plano(`${p.nombre} ${p.giro} ${p.colonia}`).includes(q)),
  );
  const signo = f.dir === "asc" ? 1 : -1;
  const valor = (p: T): string | number => {
    switch (f.orden) {
      case "puntaje":
        return p.puntaje;
      case "etapa":
        return ETAPAS.indexOf(p.etapa);
      case "seguimiento":
        return p.seguimiento ?? "9999-99-99"; // sin seguimiento al final
      default:
        return plano(String(p[f.orden] ?? ""));
    }
  };
  return r.sort((a, b) => {
    const va = valor(a);
    const vb = valor(b);
    if (va < vb) return -1 * signo;
    if (va > vb) return 1 * signo;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

/** Valores distintos de un campo con su conteo, de más a menos frecuente (para los selectores). */
export function opcionesConConteo<T>(lista: T[], campo: (p: T) => string): { valor: string; n: number }[] {
  const m = new Map<string, number>();
  for (const p of lista) {
    const v = campo(p).trim();
    if (v) m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m].map(([valor, n]) => ({ valor, n })).sort((a, b) => b.n - a.n || a.valor.localeCompare(b.valor, "es"));
}

/** Cuántos prospectos hay en cada etapa (todas las etapas, aunque tengan 0). */
export function conteoPorEtapa(lista: Pick<Prospecto, "etapa">[]): Record<Etapa, number> {
  const r = Object.fromEntries(ETAPAS.map((e) => [e, 0])) as Record<Etapa, number>;
  for (const p of lista) if (p.etapa in r) r[p.etapa]++;
  return r;
}

import { ETAPAS, type Etapa, type Prospecto } from "@/lib/types";
import { plano } from "./texto";

/** Filtro y orden de la lista del CRM (puro). */
export const ORDENES = ["puntaje", "nombre", "etapa", "seguimiento", "colonia"] as const;
export type Orden = (typeof ORDENES)[number];

export type FiltrosLista = { orden: Orden; dir: "asc" | "desc"; etapa: Etapa | null; top10: boolean; q: string };

export function leerFiltros(sp: Record<string, string | string[] | undefined>): FiltrosLista {
  const uno = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const orden = (ORDENES as readonly string[]).includes(uno("orden")) ? (uno("orden") as Orden) : "puntaje";
  const dirDef = orden === "puntaje" ? "desc" : "asc";
  const dir = uno("dir") === "asc" || uno("dir") === "desc" ? (uno("dir") as "asc" | "desc") : dirDef;
  const etapa = (ETAPAS as readonly string[]).includes(uno("etapa")) ? (uno("etapa") as Etapa) : null;
  return { orden, dir, etapa, top10: uno("top10") === "1", q: uno("q").slice(0, 100) };
}

export function filtrarYOrdenar<T extends Pick<Prospecto, "nombre" | "giro" | "colonia" | "etapa" | "puntaje" | "seguimiento" | "top10">>(
  lista: T[],
  f: FiltrosLista,
): T[] {
  const q = plano(f.q);
  const r = lista.filter(
    (p) =>
      (!f.etapa || p.etapa === f.etapa) &&
      (!f.top10 || p.top10) &&
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

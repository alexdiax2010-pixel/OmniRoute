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
  /** Categoría exacta (Salud, Automotriz…) o "" */
  categoria: string;
  /** Puntaje mínimo o null */
  min: number | null;
  /** Solo con boceto */
  boceto: boolean;
  /** Solo con teléfono o WhatsApp */
  tel: boolean;
};

/** ¿Hay algún filtro activo (además del orden)? */
export function hayFiltros(f: FiltrosLista): boolean {
  return Boolean(f.q || f.etapa || f.top10 || f.categoria || f.min != null || f.boceto || f.tel);
}

/** Filtros → query string (para enlaces de orden y "Exportar esta vista"). */
export function aQuery(f: FiltrosLista, cambios: Partial<Record<keyof FiltrosLista, string | null>> = {}): string {
  const p = new URLSearchParams();
  const v: Record<string, string | null> = {
    orden: f.orden, dir: f.dir, etapa: f.etapa, top10: f.top10 ? "1" : null, q: f.q || null,
    categoria: f.categoria || null, min: f.min != null ? String(f.min) : null, boceto: f.boceto ? "1" : null, tel: f.tel ? "1" : null,
    ...cambios,
  };
  for (const [k, x] of Object.entries(v)) if (x) p.set(k, String(x));
  return p.toString();
}

export function leerFiltros(sp: Record<string, string | string[] | undefined>): FiltrosLista {
  const uno = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const orden = (ORDENES as readonly string[]).includes(uno("orden")) ? (uno("orden") as Orden) : "puntaje";
  const dirDef = orden === "puntaje" ? "desc" : "asc";
  const dir = uno("dir") === "asc" || uno("dir") === "desc" ? (uno("dir") as "asc" | "desc") : dirDef;
  const etapa = (ETAPAS as readonly string[]).includes(uno("etapa")) ? (uno("etapa") as Etapa) : null;
  const minTxt = uno("min").trim();
  const min = minTxt !== "" && Number.isFinite(Number(minTxt)) ? Math.max(-1000, Math.min(1000, Number(minTxt))) : null;
  return {
    orden, dir, etapa, top10: uno("top10") === "1", q: uno("q").slice(0, 100),
    categoria: uno("categoria").trim().slice(0, 60), min, boceto: uno("boceto") === "1", tel: uno("tel") === "1",
  };
}

type Filtrable = Pick<Prospecto, "nombre" | "giro" | "colonia" | "etapa" | "puntaje" | "seguimiento" | "top10"> &
  Partial<Pick<Prospecto, "categoria" | "boceto" | "telefono" | "whatsapp" | "direccion">>;

export function filtrarYOrdenar<T extends Filtrable>(
  lista: T[],
  f: FiltrosLista,
): T[] {
  const q = plano(f.q);
  const r = lista.filter(
    (p) =>
      (!f.etapa || p.etapa === f.etapa) &&
      (!f.top10 || p.top10) &&
      (!f.categoria || plano(p.categoria ?? "") === plano(f.categoria)) &&
      (f.min == null || p.puntaje >= f.min) &&
      (!f.boceto || Boolean(p.boceto?.trim())) &&
      (!f.tel || Boolean((p.telefono ?? "").trim() || (p.whatsapp ?? "").trim())) &&
      (!q || plano(`${p.nombre} ${p.giro} ${p.categoria ?? ""} ${p.colonia} ${p.direccion ?? ""}`).includes(q)),
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

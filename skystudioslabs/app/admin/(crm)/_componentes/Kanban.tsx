"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ETAPAS, type Etapa } from "@/lib/types";
import { moverEtapa, moverEtapaDirecto } from "../acciones";
import s from "../../admin.module.css";

export type TarjetaKanban = {
  id: string;
  nombre: string;
  etapa: Etapa;
  puntaje: number;
  colonia: string;
  seguimiento: string | null;
  top10: boolean;
};

/**
 * Tablero con arrastrar y soltar (HTML5 nativo). Alternativa accesible con teclado y sin JS:
 * cada tarjeta tiene un select "Mover a" + botón que envía el formulario a la Server Action.
 */
export function Kanban({ tarjetas, hoy }: { tarjetas: TarjetaKanban[]; hoy: string }) {
  const [lista, mover] = useOptimistic(tarjetas, (actual, { id, etapa }: { id: string; etapa: Etapa }) =>
    actual.map((t) => (t.id === id ? { ...t, etapa } : t)),
  );
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<Etapa | null>(null);
  const [aviso, setAviso] = useState("");
  const [, startTransition] = useTransition();

  function soltar(etapa: Etapa, id: string | null) {
    setSobre(null);
    setArrastrando(null);
    const t = lista.find((x) => x.id === id);
    if (!t || t.etapa === etapa) return;
    startTransition(async () => {
      mover({ id: t.id, etapa });
      const r = await moverEtapaDirecto(t.id, etapa);
      setAviso(r.ok ? `${t.nombre} movido a ${etapa}.` : `No se pudo mover ${t.nombre}.`);
    });
  }

  return (
    <>
      <p aria-live="polite" className={s.muted} style={{ minHeight: "1.6em" }}>
        {aviso}
      </p>
      <div className={s.kanban}>
        {ETAPAS.map((etapa) => {
          const col = lista.filter((t) => t.etapa === etapa);
          return (
            <section
              key={etapa}
              aria-label={etapa}
              className={`${s.columna} ${sobre === etapa ? s.columnaSobre : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (sobre !== etapa) setSobre(etapa);
              }}
              onDragLeave={() => setSobre((x) => (x === etapa ? null : x))}
              onDrop={(e) => {
                e.preventDefault();
                soltar(etapa, e.dataTransfer.getData("text/plain") || arrastrando);
              }}
            >
              <h2 className={s.columnaTitulo}>
                <span>{etapa}</span>
                <span className={s.muted}>{col.length}</span>
              </h2>
              {col.map((t) => (
                <article
                  key={t.id}
                  className={s.tarjeta}
                  draggable
                  aria-grabbed={arrastrando === t.id}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", t.id);
                    e.dataTransfer.effectAllowed = "move";
                    setArrastrando(t.id);
                  }}
                  onDragEnd={() => setArrastrando(null)}
                >
                  <Link href={`/admin/prospectos/${encodeURIComponent(t.id)}`}>{t.nombre}</Link>
                  <span className={s.muted}>
                    {t.top10 ? "★ " : ""}
                    {t.puntaje} pts{t.colonia ? ` · ${t.colonia}` : ""}
                  </span>
                  {t.seguimiento && (
                    <span className={t.seguimiento < hoy ? s.vencido : t.seguimiento === hoy ? s.hoy : s.muted}>
                      Seguimiento: {t.seguimiento}
                    </span>
                  )}
                  <form action={moverEtapa} className={s.mover}>
                    <input type="hidden" name="id" value={t.id} />
                    <label className="sr-only" htmlFor={`mover-${t.id}`}>
                      Mover {t.nombre} a otra etapa
                    </label>
                    <select id={`mover-${t.id}`} name="etapa" defaultValue={t.etapa} className={s.select}>
                      {ETAPAS.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={`${s.btn} ${s.chip}`}>
                      Mover
                    </button>
                  </form>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { registrarActividad } from "../cartera";
import s from "../../admin.module.css";

type Opcion = { id: string; titulo: string; canal: "whatsapp" | "email" | "instagram"; texto: string };
const CANAL = { whatsapp: "WhatsApp", email: "Email", instagram: "Instagram" } as const;

/**
 * "Mensaje de captación" de Cartera: elige una plantilla (ya rellenada con los datos del prospecto),
 * edítala, cópiala o ábrela en WhatsApp, y regístrala en el historial como enviada.
 */
export function Redactor({ prospectoId, opciones, numeroWa }: { prospectoId: string; opciones: Opcion[]; numeroWa: string | null }) {
  const [elegida, setElegida] = useState(opciones[0]?.id ?? "");
  const actual = opciones.find((o) => o.id === elegida);
  const [texto, setTexto] = useState(actual?.texto ?? "");
  const [copiado, setCopiado] = useState(false);

  if (!opciones.length) return <p className={s.muted}>Crea tu primera plantilla en la sección Mensajes.</p>;

  const cambiar = (id: string) => {
    setElegida(id);
    setTexto(opciones.find((o) => o.id === id)?.texto ?? "");
  };
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* el navegador no permitió copiar: el texto sigue seleccionable */
    }
  };

  return (
    <div className={s.form}>
      <label className={s.campo}>
        <span>Plantilla</span>
        <select className={s.input} value={elegida} onChange={(e) => cambiar(e.target.value)}>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.titulo} · {CANAL[o.canal]}
            </option>
          ))}
        </select>
      </label>
      <label className={s.campo}>
        <span>Mensaje</span>
        <textarea className={s.textarea} value={texto} onChange={(e) => setTexto(e.target.value)} rows={7} maxLength={4000} />
      </label>
      <div className={s.fila}>
        <button type="button" className={s.btn} onClick={copiar}>
          {copiado ? "¡Copiado!" : "Copiar"}
        </button>
        {numeroWa && actual?.canal === "whatsapp" && (
          <a className={`${s.btn} ${s.btnWa}`} href={`https://wa.me/${numeroWa}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer">
            Abrir WhatsApp ↗
          </a>
        )}
        <form action={registrarActividad}>
          <input type="hidden" name="prospecto" value={prospectoId} />
          <input type="hidden" name="tipo" value={actual?.canal ?? "nota"} />
          <input type="hidden" name="texto" value={texto} />
          <button type="submit" className={`${s.btn} ${s.btnPrimario}`} disabled={!texto.trim()}>
            Registrar como enviado
          </button>
        </form>
      </div>
      {!numeroWa && actual?.canal === "whatsapp" && <p className={s.muted}>Este prospecto no tiene un número de celular válido para WhatsApp.</p>}
    </div>
  );
}

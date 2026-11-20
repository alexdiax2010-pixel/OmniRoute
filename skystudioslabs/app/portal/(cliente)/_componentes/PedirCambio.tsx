"use client";

import { useActionState, useEffect, useRef } from "react";
import { pedirCambio } from "../acciones";
import s from "../../portal.module.css";

export function PedirCambio() {
  const [estado, enviar, pendiente] = useActionState(pedirCambio, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado?.ok) form.current?.reset();
  }, [estado]);
  return (
    <form ref={form} action={enviar} className={s.form}>
      <label className={s.campo}>
        <span>¿Qué quieres cambiar?</span>
        <textarea name="texto" required minLength={5} maxLength={1500} className={s.textarea} placeholder="Ej. Cambiar el horario del sábado a 9 a 2." />
      </label>
      <label className={s.campo}>
        <span>Foto (opcional, JPG/PNG/WEBP, máx. 300 KB)</span>
        <input name="foto" type="file" accept="image/jpeg,image/png,image/webp" className={s.input} />
      </label>
      <div>
        <button type="submit" className={s.btn} disabled={pendiente}>
          {pendiente ? "Enviando…" : "Pedir un cambio"}
        </button>
      </div>
      <p aria-live="polite" className={estado?.ok ? s.ok : s.error}>
        {estado?.mensaje}
      </p>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import type { EstadoLogin } from "@/app/auth/acciones";
import s from "./LoginForm.module.css";

type Props = { accion: (prev: EstadoLogin, formData: FormData) => Promise<EstadoLogin> };

/** Entrar al CRM con el código especial. */
export function CodigoForm({ accion }: Props) {
  const [estado, enviar, pendiente] = useActionState(accion, null);
  return (
    <form action={enviar} className={s.form} noValidate>
      <label htmlFor="codigo" className={s.label}>
        Código especial
      </label>
      <input
        id="codigo"
        name="codigo"
        type="password"
        autoComplete="current-password"
        required
        maxLength={128}
        className={s.input}
      />
      <button type="submit" className={s.btn} disabled={pendiente}>
        {pendiente ? "Entrando…" : "Entrar con código"}
      </button>
      <div aria-live="polite" className={s.msg}>
        {estado && <p className={estado.error ? s.error : undefined}>{estado.mensaje}</p>}
      </div>
    </form>
  );
}

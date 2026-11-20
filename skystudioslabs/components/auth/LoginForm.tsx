"use client";

import { useActionState } from "react";
import type { EstadoLogin } from "@/app/auth/acciones";
import s from "./LoginForm.module.css";

type Props = {
  accion: (prev: EstadoLogin, formData: FormData) => Promise<EstadoLogin>;
  boton?: string;
};

/** Formulario de enlace mágico. El mensaje es el mismo exista o no el correo. */
export function LoginForm({ accion, boton = "Enviarme el enlace" }: Props) {
  const [estado, enviar, pendiente] = useActionState(accion, null);
  return (
    <form action={enviar} className={s.form} noValidate>
      <label htmlFor="email" className={s.label}>
        Correo electrónico
      </label>
      <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required className={s.input} />
      <button type="submit" className={s.btn} disabled={pendiente}>
        {pendiente ? "Enviando…" : boton}
      </button>
      <div aria-live="polite" className={s.msg}>
        {estado && <p className={estado.error ? s.error : undefined}>{estado.mensaje}</p>}
      </div>
      {estado?.enlaceLocal && (
        <div className={s.local} data-testid="enlace-local">
          <strong>Modo local: enlace de prueba</strong>
          <span>En producción este enlace llega por correo. Vence en 15 minutos y sirve una sola vez.</span>
          <a href={estado.enlaceLocal}>Entrar con el enlace de prueba</a>
        </div>
      )}
    </form>
  );
}

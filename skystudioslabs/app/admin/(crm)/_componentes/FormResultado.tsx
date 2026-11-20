"use client";

import { useActionState } from "react";
import type { Resultado } from "../acciones";
import { Copiar } from "./Copiar";
import s from "../../admin.module.css";

type Props = {
  accion: (prev: Resultado, formData: FormData) => Promise<Resultado>;
  boton: string;
  primario?: boolean;
  children?: React.ReactNode;
};

/** Formulario con Server Action que muestra el resultado (mensaje, enlace, comando). */
export function FormResultado({ accion, boton, primario, children }: Props) {
  const [estado, enviar, pendiente] = useActionState(accion, null);
  return (
    <form action={enviar} className={s.form}>
      {children}
      <div>
        <button type="submit" className={`${s.btn} ${primario ? s.btnPrimario : ""}`} disabled={pendiente}>
          {pendiente ? "Guardando…" : boton}
        </button>
      </div>
      <div aria-live="polite" className={s.form}>
        {estado && <p className={estado.ok ? s.ok : s.error}>{estado.mensaje}</p>}
        {estado?.comando && (
          <div className={s.aviso}>
            <code className={s.codigo}>{estado.comando}</code>
            <div style={{ marginTop: 8 }}>
              <Copiar texto={estado.comando} etiqueta="Copiar comando" />
            </div>
          </div>
        )}
        {estado?.enlace && (
          <div className={s.fila}>
            <a href={estado.enlace} target="_blank" rel="noopener noreferrer" className={s.pre}>
              {estado.enlace}
            </a>
            <Copiar texto={estado.enlace} etiqueta="Copiar enlace" />
          </div>
        )}
      </div>
    </form>
  );
}

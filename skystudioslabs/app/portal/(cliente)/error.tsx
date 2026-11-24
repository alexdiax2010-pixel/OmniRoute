"use client";

import s from "../portal.module.css";

/** Error inesperado en el portal: mensaje claro, sin detalles internos. */
export default function ErrorPortal({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={s.card} role="alert">
      <p>Algo salió mal al cargar tu portal. Inténtalo de nuevo; si sigue fallando, escríbenos por WhatsApp.</p>
      <p>
        <button type="button" className={s.btn} onClick={() => reset()}>
          Reintentar
        </button>
      </p>
    </div>
  );
}

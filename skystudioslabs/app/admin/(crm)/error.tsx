"use client";

import s from "../admin.module.css";

/** Error inesperado en el CRM (p. ej. la base de datos no responde). Sin detalles internos. */
export default function ErrorCrm({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={`${s.card} ${s.cardEmber}`} role="alert">
      <p>No se pudo cargar el CRM. Revisa tu conexión o la configuración de Supabase e inténtalo de nuevo.</p>
      <p style={{ marginTop: 12 }}>
        <button type="button" className={s.btn} onClick={() => reset()}>
          Reintentar
        </button>
      </p>
    </div>
  );
}

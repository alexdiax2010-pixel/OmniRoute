"use client";

import { useState } from "react";
import s from "../../admin.module.css";

/** Botón para copiar al portapapeles con confirmación accesible. */
export function Copiar({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [estado, setEstado] = useState<"" | "ok" | "error">("");
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
    setTimeout(() => setEstado(""), 2000);
  }
  return (
    <button type="button" className={s.btn} onClick={copiar} disabled={!texto}>
      {etiqueta}
      <span aria-live="polite" className={estado === "error" ? s.error : s.ok}>
        {estado === "ok" ? " ✓ Copiado" : estado === "error" ? " No se pudo copiar" : ""}
      </span>
    </button>
  );
}

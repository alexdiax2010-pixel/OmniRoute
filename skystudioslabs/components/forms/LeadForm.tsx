"use client";

import { useId, useState } from "react";
import s from "./LeadForm.module.css";
import { linkWhatsApp } from "@/config/sitio";

type Estado = { tipo: "inicial" } | { tipo: "enviando" } | { tipo: "ok"; wa: string } | { tipo: "error"; mensaje: string; campos?: Record<string, string> };

/** Formulario de contacto público. Envía a /api/prospectos (funciona también sin JS). */
export function LeadForm({ origen }: { origen?: string }) {
  const id = useId();
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });
  const campos = estado.tipo === "error" ? (estado.campos ?? {}) : {};

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const datos = Object.fromEntries(new FormData(form).entries());
    setEstado({ tipo: "enviando" });
    try {
      const res = await fetch("/api/prospectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; campos?: Record<string, string> };
      if (res.ok && j.ok) {
        form.reset();
        const n = String(datos.nombre ?? "").trim();
        const neg = String(datos.negocio ?? "").trim();
        setEstado({ tipo: "ok", wa: linkWhatsApp(`Hola, soy ${n} de ${neg}. Acabo de pedir mi boceto gratis en su página.`) });
      } else {
        setEstado({ tipo: "error", mensaje: j.error ?? "No pudimos enviar tu mensaje. Inténtalo de nuevo.", campos: j.campos });
      }
    } catch {
      setEstado({ tipo: "error", mensaje: "Sin conexión. Revisa tu internet e inténtalo de nuevo." });
    }
  }

  const campo = (nombre: "nombre" | "negocio" | "whatsapp", etiqueta: string, extra: React.InputHTMLAttributes<HTMLInputElement>, ayuda?: string) => {
    const err = campos[nombre];
    const desc = [ayuda ? `${id}-${nombre}-ayuda` : "", err ? `${id}-${nombre}-error` : ""].filter(Boolean).join(" ") || undefined;
    return (
      <div className={s.campo}>
        <label htmlFor={`${id}-${nombre}`} className={s.label}>
          {etiqueta}
        </label>
        <input id={`${id}-${nombre}`} name={nombre} required className={s.input} aria-invalid={err ? true : undefined} aria-describedby={desc} {...extra} />
        {ayuda && (
          <span id={`${id}-${nombre}-ayuda`} className={s.ayuda}>
            {ayuda}
          </span>
        )}
        {err && (
          <span id={`${id}-${nombre}-error`} className={s.errorCampo}>
            {err}
          </span>
        )}
      </div>
    );
  };

  return (
    <form className={s.form} onSubmit={enviar} action="/api/prospectos" method="post" noValidate>
      <input type="hidden" name="origen" value={origen ?? "sitio"} />
      {campo("nombre", "Tu nombre", { autoComplete: "name", maxLength: 80 })}
      {campo("negocio", "Nombre de tu negocio", { autoComplete: "organization", maxLength: 120 })}
      {campo("whatsapp", "WhatsApp", { type: "tel", inputMode: "numeric", autoComplete: "tel-national", maxLength: 16, placeholder: "33 1234 5678" }, "10 dígitos, sin +52.")}
      {/* Trampa para bots: invisible para personas y lectores de pantalla. */}
      <div className={s.trampa} aria-hidden="true">
        <label htmlFor={`${id}-sitio_web`}>No llenes este campo</label>
        <input id={`${id}-sitio_web`} name="sitio_web" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <button type="submit" className={s.btn} disabled={estado.tipo === "enviando"}>
        {estado.tipo === "enviando" ? "Enviando…" : "Quiero mi boceto gratis"}
      </button>
      <p className={s.estado} aria-live="polite" role="status">
        {estado.tipo === "ok" && (
          <span className={s.ok}>
            ¡Gracias! Ya recibimos tus datos. Para que te atienda más rápido,{" "}
            <a href={estado.wa} target="_blank" rel="noopener noreferrer" data-testid="lead-wa">
              envíame tu solicitud por WhatsApp →
            </a>
          </span>
        )}
        {estado.tipo === "error" && <span className={s.error}>{estado.mensaje}</span>}
      </p>
    </form>
  );
}

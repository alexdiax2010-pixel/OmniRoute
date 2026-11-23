"use client";

import { useEffect, useId, useRef, useState } from "react";
import s from "./LeadForm.module.css";
import { linkWhatsApp } from "@/config/sitio";
import { CAMPOS_LEAD, resultadoSinJs, validarLead, type CampoLead } from "./validacion";

type Estado =
  | { tipo: "inicial" }
  | { tipo: "enviando" }
  | { tipo: "ok"; wa: string }
  | { tipo: "error"; mensaje: string; campos?: Record<string, string>; conWhatsApp?: boolean };

const MENSAJE_FALLA = "No pudimos enviar tus datos.";

/**
 * Formulario de contacto público. Envía a /api/prospectos (funciona también sin JS).
 * Contrato con el servidor (lib/lead.ts): nombre, negocio, whatsapp, origen y el campo trampa sitio_web.
 */
export function LeadForm({ origen }: { origen?: string }) {
  const id = useId();
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });
  const formRef = useRef<HTMLFormElement>(null);
  const estadoRef = useRef<HTMLParagraphElement>(null);
  const campos = estado.tipo === "error" ? (estado.campos ?? {}) : {};

  // Si se envió sin JavaScript, /api/prospectos regresa con ?lead=ok|error#contacto.
  useEffect(() => {
    const r = resultadoSinJs(window.location.search);
    if (r === "ok") setEstado({ tipo: "ok", wa: linkWhatsApp("Hola, acabo de pedir mi boceto gratis en su página.") });
    else if (r === "error")
      setEstado({ tipo: "error", mensaje: `${MENSAJE_FALLA} Revisa tus datos e inténtalo de nuevo.`, conWhatsApp: true });
  }, []);

  // Al terminar, lleva el foco al mensaje para que lectores de pantalla y celulares lo vean.
  useEffect(() => {
    if (estado.tipo === "ok" || (estado.tipo === "error" && !estado.campos)) estadoRef.current?.focus();
  }, [estado]);

  function enfocarPrimerError(errores: Record<string, string>) {
    const primero = CAMPOS_LEAD.find((c) => errores[c]);
    if (primero) formRef.current?.querySelector<HTMLInputElement>(`[name="${primero}"]`)?.focus();
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const datos = Object.fromEntries(new FormData(form).entries());

    const errores = validarLead(datos) as Record<string, string>;
    if (Object.keys(errores).length > 0) {
      const n = Object.keys(errores).length;
      setEstado({ tipo: "error", mensaje: n === 1 ? "Revisa el campo marcado." : `Revisa los ${n} campos marcados.`, campos: errores });
      enfocarPrimerError(errores);
      return;
    }

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
      } else if (j.campos && Object.keys(j.campos).length > 0) {
        setEstado({ tipo: "error", mensaje: j.error ?? "Revisa los campos marcados.", campos: j.campos });
        enfocarPrimerError(j.campos);
      } else {
        setEstado({ tipo: "error", mensaje: j.error ?? `${MENSAJE_FALLA} Inténtalo de nuevo.`, conWhatsApp: true });
      }
    } catch {
      setEstado({ tipo: "error", mensaje: "Sin conexión. Revisa tu internet e inténtalo de nuevo.", conWhatsApp: true });
    }
  }

  /** Al corregir un campo, quita su error sin esperar a reenviar. */
  function alEscribir(e: React.FormEvent<HTMLFormElement>) {
    const nombre = (e.target as HTMLInputElement).name as CampoLead;
    if (estado.tipo !== "error" || !estado.campos?.[nombre]) return;
    const resto = { ...estado.campos };
    delete resto[nombre];
    setEstado(Object.keys(resto).length > 0 ? { ...estado, campos: resto } : { tipo: "inicial" });
  }

  const campo = (
    nombre: CampoLead,
    etiqueta: string,
    extra: React.InputHTMLAttributes<HTMLInputElement>,
    ayuda?: string
  ) => {
    const err = campos[nombre];
    const desc = [ayuda ? `${id}-${nombre}-ayuda` : "", err ? `${id}-${nombre}-error` : ""].filter(Boolean).join(" ") || undefined;
    return (
      <div className={s.campo}>
        <label htmlFor={`${id}-${nombre}`} className={s.label}>
          {etiqueta}
        </label>
        <input
          id={`${id}-${nombre}`}
          name={nombre}
          required
          className={s.input}
          aria-invalid={err ? true : undefined}
          aria-describedby={desc}
          {...extra}
        />
        {ayuda && (
          <span id={`${id}-${nombre}-ayuda`} className={s.ayuda}>
            {ayuda}
          </span>
        )}
        {err && (
          <span id={`${id}-${nombre}-error`} className={s.errorCampo}>
            <span aria-hidden="true">⚠ </span>
            {err}
          </span>
        )}
      </div>
    );
  };

  return (
    <form
      ref={formRef}
      className={s.form}
      onSubmit={enviar}
      onInput={alEscribir}
      action="/api/prospectos"
      method="post"
      noValidate
      aria-label="Pide tu boceto gratis"
    >
      <input type="hidden" name="origen" value={origen ?? "sitio"} />
      {campo("nombre", "Tu nombre", { autoComplete: "name", maxLength: 80, autoCapitalize: "words" })}
      {campo("negocio", "Nombre de tu negocio", { autoComplete: "organization", maxLength: 120, autoCapitalize: "words" })}
      {campo(
        "whatsapp",
        "WhatsApp",
        { type: "tel", inputMode: "tel", autoComplete: "tel-national", maxLength: 20, placeholder: "33 1234 5678" },
        "10 dígitos. Ahí te mandamos tu boceto."
      )}
      {/* Trampa para bots: invisible para personas y lectores de pantalla. */}
      <div className={s.trampa} aria-hidden="true">
        <label htmlFor={`${id}-sitio_web`}>No llenes este campo</label>
        <input id={`${id}-sitio_web`} name="sitio_web" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <button
        type="submit"
        className={s.btn}
        disabled={estado.tipo === "enviando"}
        aria-busy={estado.tipo === "enviando" || undefined}
        aria-describedby={`${id}-nota`}
      >
        {estado.tipo === "enviando" ? "Enviando…" : "Quiero mi boceto gratis"}
      </button>
      <p id={`${id}-nota`} className={s.ayuda}>
        Sin costo ni compromiso. Te escribimos por WhatsApp para enseñarte tu boceto.
      </p>
      <p ref={estadoRef} className={s.estado} aria-live="polite" role="status" tabIndex={-1}>
        {estado.tipo === "ok" && (
          <span className={s.ok}>
            ¡Gracias! Ya recibimos tus datos. Para que te atendamos más rápido,{" "}
            <a href={estado.wa} target="_blank" rel="noopener noreferrer" data-testid="lead-wa">
              mándanos tu solicitud por WhatsApp →
            </a>
          </span>
        )}
        {estado.tipo === "error" && (
          <span className={s.error}>
            {estado.mensaje}
            {estado.conWhatsApp && (
              <>
                {" "}
                <a href={linkWhatsApp()} target="_blank" rel="noopener noreferrer">
                  O escríbenos directo por WhatsApp →
                </a>
              </>
            )}
          </span>
        )}
      </p>
    </form>
  );
}

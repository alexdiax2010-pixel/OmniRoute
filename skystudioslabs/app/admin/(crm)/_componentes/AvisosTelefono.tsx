"use client";

import { useEffect, useState } from "react";
import { activarAvisos, desactivarAvisos, probarAviso } from "../avisos";
import s from "../../admin.module.css";

function llaveAUint8(base64: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(b.length));
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

type Estado = "cargando" | "no-soportado" | "instalar-iphone" | "bloqueado" | "inactivo" | "activo";

/** Botón para recibir una notificación en el teléfono con cada cliente nuevo. */
export function AvisosTelefono({ llavePublica }: { llavePublica: string }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    (async () => {
      const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const instalada = window.matchMedia("(display-mode: standalone)").matches;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setEstado(esIOS && !instalada ? "instalar-iphone" : "no-soportado");
        return;
      }
      if (Notification.permission === "denied") return setEstado("bloqueado");
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const sub = await reg.pushManager.getSubscription();
      setEstado(sub ? "activo" : "inactivo");
    })().catch(() => setEstado("no-soportado"));
  }, []);

  async function activar() {
    setOcupado(true);
    setMensaje("");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
        if (permiso !== "denied") setMensaje("Toca “Permitir” cuando el teléfono te pregunte por las notificaciones.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: llaveAUint8(llavePublica) }));
      const r = await activarAvisos({ ...JSON.parse(JSON.stringify(sub)), etiqueta: navigator.userAgent.slice(0, 80) });
      setMensaje(r.mensaje);
      setEstado(r.ok ? "activo" : "inactivo");
    } catch {
      setMensaje("No se pudo activar en este teléfono.");
    } finally {
      setOcupado(false);
    }
  }

  async function desactivar() {
    setOcupado(true);
    try {
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (sub) {
        await desactivarAvisos(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("inactivo");
      setMensaje("Avisos desactivados en este teléfono.");
    } finally {
      setOcupado(false);
    }
  }

  async function probar() {
    setOcupado(true);
    try {
      setMensaje((await probarAviso()).mensaje);
    } finally {
      setOcupado(false);
    }
  }

  if (estado === "cargando") return null;
  return (
    <section className={s.avisos} aria-live="polite">
      <strong>Avisos de clientes nuevos</strong>
      {estado === "activo" && (
        <>
          <span>🔔 Activados en este teléfono.</span>
          <span className={s.avisosBtns}>
            <button type="button" className={s.btnSec} onClick={probar} disabled={ocupado}>
              Enviar prueba
            </button>
            <button type="button" className={s.linkBtn} onClick={desactivar} disabled={ocupado}>
              Desactivar
            </button>
          </span>
        </>
      )}
      {estado === "inactivo" && (
        <>
          <span>Recibe una notificación en este teléfono cada vez que llegue un cliente.</span>
          <button type="button" className={s.btn} onClick={activar} disabled={ocupado}>
            Activar avisos en este teléfono
          </button>
        </>
      )}
      {estado === "instalar-iphone" && (
        <span>
          En iPhone: toca <b>Compartir</b> → <b>Agregar a pantalla de inicio</b>, abre “CRM Sky” desde ese ícono y vuelve aquí
          para activar los avisos.
        </span>
      )}
      {estado === "bloqueado" && (
        <span>Las notificaciones están bloqueadas para este sitio. Permítelas en los ajustes del navegador y recarga.</span>
      )}
      {estado === "no-soportado" && <span>Este navegador no admite notificaciones. Prueba con Chrome o Safari actualizado.</span>}
      {mensaje && <span className={s.muted}>{mensaje}</span>}
    </section>
  );
}

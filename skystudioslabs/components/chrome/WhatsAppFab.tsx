import { linkWhatsApp } from "@/config/sitio";
import { IconoWhatsApp } from "./IconoWhatsApp";
import s from "./chrome.module.css";

/** Botón flotante de WhatsApp, visible en todo el sitio público. */
export function WhatsAppFab() {
  return (
    <a className={s.fab} href={linkWhatsApp()} target="_blank" rel="noopener noreferrer" aria-label="Escríbeme por WhatsApp">
      <IconoWhatsApp className={s.fabIcono} />
    </a>
  );
}

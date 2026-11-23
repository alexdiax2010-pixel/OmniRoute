import { Fragment } from "react";
import { NUMEROS, formatoTelefono, linkWhatsApp } from "@/config/sitio";
import { IconoWhatsApp } from "./IconoWhatsApp";
import s from "./chrome.module.css";

type Variante = "lista" | "linea" | "botones";

/**
 * Los dos números de Sky Studios Labs, cada uno con WhatsApp y llamada.
 * - "lista": un <li> por número (pie de página).
 * - "linea": párrafos cortos (bloques de contacto).
 * - "botones": una tarjeta por número con dos botones grandes (escena de cierre).
 * Cada enlace lleva el número en su nombre accesible: con dos números, "WhatsApp" a secas sería ambiguo.
 */
export function Contactos({ variante = "linea", mensaje }: { variante?: Variante; mensaje?: string }) {
  if (variante === "botones") {
    return (
      <ul className={s.contactoBotones} data-contactos>
        {NUMEROS.map((n) => {
          const tel = formatoTelefono(n);
          return (
            <li key={n} className={s.contactoTarjeta}>
              <span className={s.contactoNumero}>{tel}</span>
              <span className={s.contactoAcciones}>
                <a
                  className={`btn btn-wa ${s.contactoBtn}`}
                  href={linkWhatsApp(mensaje, n)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-contacto="wa"
                  aria-label={`WhatsApp al ${tel}`}
                >
                  <IconoWhatsApp className={s.contactoIcono} />
                  WhatsApp
                </a>
                <a className={`btn btn-ghost ${s.contactoBtn}`} href={`tel:+${n}`} data-contacto="tel" aria-label={`Llamar al ${tel}`}>
                  <svg className={s.contactoIcono} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M6.6 3.5h2.6l1.3 4-1.9 1.4a12 12 0 0 0 6.5 6.5l1.4-1.9 4 1.3v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Llamar
                </a>
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  const filas = NUMEROS.map((n) => {
    const tel = formatoTelefono(n);
    return (
      <Fragment key={n}>
        <span>{tel}</span>
        {" · "}
        <a
          href={linkWhatsApp(mensaje, n)}
          target="_blank"
          rel="noopener noreferrer"
          data-contacto="wa"
          aria-label={`WhatsApp al ${tel}`}
        >
          WhatsApp
        </a>
        {" · "}
        <a href={`tel:+${n}`} data-contacto="tel" aria-label={`Llamar al ${tel}`}>
          Llamar
        </a>
      </Fragment>
    );
  });
  if (variante === "lista") return <>{filas.map((f, i) => <li key={NUMEROS[i]}>{f}</li>)}</>;
  return (
    <div data-contactos>
      {filas.map((f, i) => (
        <p key={NUMEROS[i]} className="muted">
          {f}
        </p>
      ))}
    </div>
  );
}

import { NUMEROS, formatoTelefono, linkWhatsApp } from "@/config/sitio";

/**
 * Los dos números de Sky Studios Labs, cada uno con WhatsApp y llamada.
 * "lista": un <li> por número (pie de página). "linea": párrafos cortos (bloques de contacto).
 */
export function Contactos({ variante = "linea", mensaje }: { variante?: "lista" | "linea"; mensaje?: string }) {
  const filas = NUMEROS.map((n) => (
    <>
      <span>{formatoTelefono(n)}</span>
      {" · "}
      <a href={linkWhatsApp(mensaje, n)} target="_blank" rel="noopener noreferrer" data-contacto="wa">
        WhatsApp
      </a>
      {" · "}
      <a href={`tel:+${n}`} data-contacto="tel">
        Llamar
      </a>
    </>
  ));
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

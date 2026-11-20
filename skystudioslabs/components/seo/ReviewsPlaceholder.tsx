import { Encabezado } from "./Encabezado";
import s from "./seo.module.css";

/**
 * Espacio para reseñas REALES. Nunca inventes testimonios: reemplaza cada marcador por una
 * reseña verdadera (idealmente copiada de Google, con permiso del cliente).
 */
export function ReviewsPlaceholder() {
  return (
    <section className="section" aria-labelledby="resenas-titulo">
      <div className="container">
        <Encabezado antetitulo="Reseñas" titulo="Lo que dicen los *clientes*" id="resenas-titulo" />
        <ul className={s.resenas}>
          {[1, 2, 3].map((n) => (
            <li key={n} className={`card ${s.resena}`}>
              <p>
                <span className="placeholder">[RESEÑA REAL AQUÍ]</span>
              </p>
              <p className="muted">
                <span className="placeholder">[NOMBRE DEL CLIENTE]</span> · <span className="placeholder">[NEGOCIO]</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import s from "./scenes.module.css";
import Image from "next/image";
import { PORTAFOLIO, clientesSinSitio } from "@/config/portafolio";

const MAX_ESTRELLAS = 48;

/** Posiciones deterministas (espiral áurea dentro de una elipse) para que el HTML sea estable. */
function estrellas(n: number) {
  const pts: Array<{ x: number; y: number; r: number }> = [];
  for (let i = 0; i < n; i++) {
    const t = Math.sqrt((i + 0.5) / n);
    const a = i * 2.39996 + 0.6;
    pts.push({ x: 500 + Math.cos(a) * t * 440, y: 280 + Math.sin(a) * t * 230, r: 3 + ((i * 7) % 4) });
  }
  return pts;
}

/** Une cada estrella con la más cercana de las anteriores: forma una constelación conectada. */
function enlaces(pts: Array<{ x: number; y: number }>) {
  const out: Array<[number, number]> = [];
  for (let i = 1; i < pts.length; i++) {
    let best = 0;
    let bestD = Infinity;
    for (let j = 0; j < i; j++) {
      const d = (pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    out.push([best, i]);
  }
  return out;
}

/** Una estrella por negocio: sitios publicados + clientes del portafolio sin sitio propio. */
export function SceneConstelacion({ activos }: { activos: number }) {
  const total = Math.max(activos, 0) + clientesSinSitio();
  const n = Math.min(total, MAX_ESTRELLAS);
  const pts = estrellas(n);
  const links = enlaces(pts);

  return (
    <section data-scene="constelacion" className={s.scene} aria-labelledby="constelacion-titulo">
      <div data-stage className={s.stage}>
        <div data-cam className={s.camera}>
          <div className={s.bg} aria-hidden="true">
            <div data-glow className={`glow glow--ember glow--breathe ${s.glowA}`} />
          </div>
          <div className={s.inner} style={{ textAlign: "center" }}>
            {total > 0 ? (
              <h2 id="constelacion-titulo" className="t-title" data-split>
                Cada estrella es un negocio que ya <em className="hl">brilla</em>
              </h2>
            ) : (
              <h2 id="constelacion-titulo" className="t-title" data-split>
                Tu negocio puede ser la <em className="hl">primera</em> estrella
              </h2>
            )}
          </div>
          <div className={s.sky} data-sky>
            <svg viewBox={n === 0 ? "0 200 1000 160" : "0 0 1000 560"} aria-hidden="true" focusable="false">
              {links.map(([a, b], i) => (
                <line
                  key={`l${i}`}
                  data-link
                  className={s.link}
                  x1={pts[a].x}
                  y1={pts[a].y}
                  x2={pts[b].x}
                  y2={pts[b].y}
                  pathLength={1}
                />
              ))}
              {pts.map((p, i) => (
                <circle key={`s${i}`} data-star className={s.star} cx={p.x} cy={p.y} r={p.r} />
              ))}
              {n === 0 && <circle data-star className={s.starGhost} cx="500" cy="280" r="18" />}
            </svg>
          </div>
          <div className={s.skyCount} data-cam-target="count">
            <strong className={`t-display ${s.skyCountNum}`} data-count={total}>
              {total}
            </strong>
            <p className="muted" data-anim>
              {total === 1 ? "negocio que ya trabaja con nosotros" : "negocios que ya trabajan con nosotros"}. Una
              estrella por cada uno.
            </p>
          </div>
        </div>
      </div>

      <div className={s.after}>
        <div className={s.clientes} id="clientes">
          <h3 className="t-title" data-split>
            Nuestros <em className="hl">clientes</em>
          </h3>
          <ul className={s.clientesLista}>
            {PORTAFOLIO.map((c) => (
              <li key={c.nombre} className={`card ${s.clienteCard}`} data-anim>
                <figure className={s.clienteImagen}>
                  <Image
                    src={c.imagen.src}
                    alt={c.imagen.alt}
                    width={c.imagen.ancho}
                    height={c.imagen.alto}
                    sizes="(max-width: 800px) 100vw, 600px"
                    loading="lazy"
                  />
                </figure>
                <div className={s.clienteTexto}>
                  <p className={s.clienteGiro}>{c.giro}</p>
                  <h4 className="t-title">{c.nombre}</h4>
                  <p>{c.trabajo}</p>
                  <ul className={s.clienteIncluye}>
                    {c.incluye.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p className="muted">Capturas con datos de ejemplo.</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className={s.reviews}>
          <h3 className="t-title" data-split>
            Lo que dicen nuestros <em className="hl">clientes</em>
          </h3>
          <ul className="grid grid-3">
            {[1, 2, 3].map((i) => (
              <li key={i} className={`card ${s.reviewCard}`} data-anim>
                <span className="placeholder">[RESEÑA REAL AQUÍ]</span>
                <span className="muted">
                  <span className="placeholder">[NOMBRE Y NEGOCIO]</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

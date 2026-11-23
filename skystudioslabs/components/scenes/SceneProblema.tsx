import s from "./scenes.module.css";

const BUSQUEDAS = ["taller cerca de mí", "dentista en Monterrey"];

export function SceneProblema() {
  return (
    <section data-scene="problema" className={s.scene} aria-labelledby="problema-titulo">
      <div data-stage className={s.stage}>
        <div data-cam className={s.camera}>
          <div className={s.bg} aria-hidden="true">
            <div data-glow className={`glow glow--ember glow--breathe ${s.glowC}`} />
          </div>
          <div className={`${s.inner} ${s.split}`}>
            <div className={s.copy}>
              <h2 id="problema-titulo" className="t-title" data-split>
                Tu negocio es bueno. ¿Pero te <em className="hl">encuentran</em>?
              </h2>
              <p className="muted" data-anim>
                Hoy la gente busca en Google antes de salir de casa. Búsquedas como “{BUSQUEDAS[0]}” o “
                {BUSQUEDAS[1]}” pasan todos los días, y si no apareces, el cliente se va con quien sí aparece.
              </p>
            </div>
            <div className={s.searchCol}>
              <div className={s.search} data-cam-target="search" data-anim role="img" aria-label={`Búsqueda de ejemplo: ${BUSQUEDAS[0]}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className={s.typed} data-typed data-queries={JSON.stringify(BUSQUEDAS)}>
                  {BUSQUEDAS[0]}
                </span>
                <span className={s.caret} aria-hidden="true" />
              </div>
              <ul className={s.results} aria-label="Resultados de ejemplo">
                <li className={s.result} data-result="a">Negocio con página web</li>
                <li className={s.result} data-result="a">Negocio con Google Maps</li>
                <li className={s.result} data-result="a">Negocio con reseñas</li>
                <li className={s.result} data-result="b">Negocio con fotos y horarios</li>
                <li className={s.result} data-result="b">Negocio con WhatsApp directo</li>
                <li className={`${s.result} ${s.resultYou}`} data-result="you">
                  ¿Y tu negocio? No aparece.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

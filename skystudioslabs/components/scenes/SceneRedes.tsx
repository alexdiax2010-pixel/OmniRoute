import s from "./scenes.module.css";

const BARRAS = [28, 40, 46, 60, 72, 90];

export function SceneRedes() {
  return (
    <section data-scene="redes" className={s.scene} aria-labelledby="redes-titulo">
      <div data-stage className={s.stage}>
        <div data-cam className={s.camera}>
          <div className={s.bg} aria-hidden="true">
            <div data-glow className={`glow glow--ember glow--breathe ${s.glowC}`} />
          </div>
          <div className={`${s.inner} ${s.split}`}>
            <div className={s.copy}>
              <p className={`t-body ${s.label}`} data-anim>Servicio 3 · Redes sociales</p>
              <h2 id="redes-titulo" className="t-title" data-split>
                Redes que <em className="hl">trabajan</em> por ti
              </h2>
              <p className="muted" data-anim>
                Un plan de publicaciones con diseños que se ven profesionales, para que tu negocio se mantenga
                activo sin que pierdas horas frente al celular.
              </p>
              <figure className={s.chart} data-anim>
                <div className={s.bars} aria-hidden="true">
                  {BARRAS.map((h, i) => (
                    <span key={i} className={s.bar} data-bar style={{ height: `${h}%` }} />
                  ))}
                </div>
                <figcaption>Gráfica ilustrativa: la constancia hace crecer tu presencia. No son datos reales.</figcaption>
              </figure>
            </div>
            <div className={s.posts} data-cam-target="posts" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} className={s.post} data-post />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

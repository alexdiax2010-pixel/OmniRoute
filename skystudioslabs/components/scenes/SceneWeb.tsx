import s from "./scenes.module.css";

export function SceneWeb() {
  return (
    <section data-scene="web" className={s.scene} aria-labelledby="web-titulo">
      <div data-stage className={s.stage}>
        <div data-cam className={s.camera}>
          <div className={s.bg} aria-hidden="true">
            <div data-glow className={`glow glow--ember glow--breathe ${s.glowB}`} />
          </div>
          <div className={`${s.inner} ${s.split}`}>
            <div className={s.copy}>
              <p className={`t-body ${s.label}`} data-anim>Servicio 1 · Página web</p>
              <h2 id="web-titulo" className="t-title" data-split>
                Páginas que <em className="hl">venden</em>
              </h2>
              <p className="muted" data-anim>
                Una página clara, rápida y hecha para celular, con tus servicios, fotos, horarios y un botón de
                WhatsApp para que te escriban en un toque.
              </p>
            </div>
            <figure className={s.browser} data-cam-target="browser" data-anim>
              <div className={s.browserBar} aria-hidden="true">
                <span className={s.dots}>
                  <span />
                  <span />
                  <span />
                </span>
                <span className={s.url}>skystudioslabs.com/tu-negocio</span>
              </div>
              <div className={s.mini} aria-hidden="true">
                <div className={s.miniNav} data-mini>
                  <span className={s.miniLogo} />
                  <span className={s.miniBar} style={{ width: "22%" }} />
                  <span style={{ flex: 1 }} />
                  <span className={s.miniBar} style={{ width: "12%" }} />
                  <span className={s.miniBar} style={{ width: "12%" }} />
                </div>
                <div className={s.miniHero} data-mini>
                  <strong>TU NEGOCIO</strong>
                  <span className={s.miniBar} style={{ width: "70%" }} />
                  <span className={s.miniBar} style={{ width: "50%" }} />
                  <span className={s.miniBtn} data-mini-btn>
                    WhatsApp
                  </span>
                </div>
                <div className={s.miniCards} data-mini>
                  <span className={s.miniCard} />
                  <span className={s.miniCard} />
                  <span className={s.miniCard} />
                </div>
              </div>
              <figcaption className={s.caption}>Ejemplo de diseño</figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

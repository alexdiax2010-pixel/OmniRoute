import { CircleText } from "./CircleText";
import s from "./scenes.module.css";

const EMBERS = [
  [8, 92], [18, 80], [27, 96], [36, 86], [44, 98], [55, 84],
  [63, 94], [71, 82], [80, 97], [88, 88], [93, 76], [12, 70],
] as const;

export function SceneIntro() {
  return (
    <section data-scene="intro" className={s.scene} aria-labelledby="intro-titulo">
      <div data-stage className={s.stage}>
        <div data-cam className={s.camera}>
          <div className={s.bg} aria-hidden="true">
            <div data-glow className={`glow glow--ember glow--breathe ${s.glowA}`} />
            <div data-glow className={`glow glow--ember ${s.glowB}`} />
            {EMBERS.map(([x, y], i) => (
              <span
                key={i}
                data-ember
                className={s.ember}
                style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i * 0.8) % 9}s` }}
              />
            ))}
          </div>

          <div className={s.sunWrap} aria-hidden="true">
            <div className={s.sunClip}>
              <div data-sun-rise style={{ position: "absolute", inset: 0 }}>
                <div data-sun className={s.sun} />
              </div>
            </div>
          </div>
          <div data-horizon className={s.horizon} aria-hidden="true" />

          <div className={`${s.inner} ${s.introContent}`}>
            <p className={`t-body ${s.label}`} data-anim>
              Agencia web en Zapopan y Guadalajara
            </p>
            <h1 id="intro-titulo" className="t-display" data-split="display">
              Sky Studios Labs
            </h1>
            <p className="t-title" data-split>
              Hacemos que tu negocio <em className="hl">brille</em> en internet
            </p>
            <div className={s.ctaRow} data-anim>
              <a className="btn btn-primary" href="#contacto">
                Pide tu boceto gratis
              </a>
              <a className="btn btn-ghost" href="#precios">
                Ver paquetes
              </a>
            </div>
          </div>

          <div className={s.badge} data-cam-target="badge">
            <CircleText />
          </div>
        </div>
      </div>
    </section>
  );
}

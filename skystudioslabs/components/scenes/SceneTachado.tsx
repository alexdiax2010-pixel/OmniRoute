import s from "./scenes.module.css";

function Strike() {
  return (
    <svg className={s.strikeSvg} viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path data-strike d="M1 6 C 30 3, 65 8, 99 4" pathLength={1} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function SceneTachado({ activos }: { activos: number }) {
  return (
    <section data-scene="tachado" className={s.scene} aria-labelledby="tachado-titulo">
      <div data-stage className={s.stage}>
        <div data-cam className={s.camera}>
          <div className={s.bg} aria-hidden="true">
            <div data-glow className={`glow glow--ember glow--breathe ${s.glowA}`} />
          </div>
          <div className={s.inner}>
            <h2 id="tachado-titulo" className="t-display">
              <span className={s.strikeLine} data-strike-line>
                <span data-split>Sin página.</span>
                <Strike />
              </span>
              <span className={s.strikeLine} data-strike-line>
                <span data-split>Sin Google Maps.</span>
                <Strike />
              </span>
            </h2>
            <div className={s.withWrap}>
              <canvas data-particles className={s.particles} aria-hidden="true" />
              <p className="t-display" data-split="display" data-particle-source>
                Con <em className="hl">Sky Studios Labs</em>
              </p>
            </div>
            <ul className={s.counters} data-cam-target="counters" aria-label="Sky Studios Labs en números">
              <li className={s.counter} data-anim>
                <strong className="t-title" data-count="4">4</strong> servicios
              </li>
              <li className={s.counter} data-anim>
                <strong className="t-title" data-count="4">4</strong> pasos
              </li>
              <li className={s.counter} data-anim>
                <strong className="t-title" data-count={activos}>{activos}</strong>{" "}
                {activos === 1 ? "sitio activo" : "sitios activos"}
              </li>
              <li className={s.counter} data-anim>
                <strong className="t-title" data-count="1">1</strong> boceto gratis
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

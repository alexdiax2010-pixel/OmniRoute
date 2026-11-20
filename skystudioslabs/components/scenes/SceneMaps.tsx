import s from "./scenes.module.css";

const ORBIT = [0, 60, 120, 180, 240, 300];

export function SceneMaps() {
  return (
    <section data-scene="maps" className={s.scene} aria-labelledby="maps-titulo">
      <div data-stage className={s.stage}>
        <div data-cam className={s.camera}>
          <div className={s.bg} aria-hidden="true">
            <div data-glow className={`glow glow--electric glow--breathe ${s.glowA}`} />
          </div>
          <div className={`${s.inner} ${s.split}`}>
            <div className={s.copy}>
              <p className={`t-body ${s.label}`} data-anim>Servicio 2 · Google Maps</p>
              <h2 id="maps-titulo" className="t-title" data-split>
                Que te <em className="hl hl--blue">encuentren</em> en Google Maps
              </h2>
              <p className="muted" data-anim>
                Damos de alta y optimizamos tu ficha para que aparezcas cuando alguien cerca de ti busca lo que
                vendes, con dirección, horarios, fotos y botón para llamar.
              </p>
              <div className={s.orbitRow}>
                <div className={s.orbit} data-orbit aria-hidden="true">
                  <div className={s.orbitRing} data-orbit-ring>
                    {ORBIT.map((a) => (
                      <span
                        key={a}
                        className={s.orbitDot}
                        data-orbit-dot
                        style={{ transform: `rotate(${a}deg) translateX(90px)` }}
                      />
                    ))}
                  </div>
                  <div className={`${s.orbitCore} t-title`} data-orbit-core>
                    +1
                  </div>
                </div>
                <p className="t-title" data-split>
                  +1 cliente que te <em className="hl hl--blue">encuentra</em>
                </p>
              </div>
            </div>
            <div className={s.map} data-anim>
              <svg viewBox="0 0 400 300" aria-hidden="true" focusable="false">
                <rect width="400" height="300" fill="#0a1020" />
                <g fill="#101a33">
                  <rect x="20" y="20" width="90" height="70" rx="6" />
                  <rect x="130" y="20" width="110" height="70" rx="6" />
                  <rect x="260" y="20" width="120" height="70" rx="6" />
                  <rect x="20" y="110" width="90" height="80" rx="6" />
                  <rect x="130" y="110" width="110" height="80" rx="6" />
                  <rect x="260" y="110" width="120" height="80" rx="6" />
                  <rect x="20" y="210" width="90" height="70" rx="6" />
                  <rect x="130" y="210" width="110" height="70" rx="6" />
                  <rect x="260" y="210" width="120" height="70" rx="6" />
                </g>
                <path d="M300 225 q30 -10 60 10 l0 35 q-30 10 -60 -5 z" fill="#0f2b22" />
                <path data-street className={s.street} d="M0 100 H400" pathLength={1} />
                <path data-street className={s.street} d="M0 200 H400" pathLength={1} />
                <path data-street className={s.street} d="M120 0 V300" pathLength={1} />
                <path data-street className={s.street} d="M250 0 V300" pathLength={1} />
                <path data-street className={`${s.street} ${s.streetMain}`} d="M0 290 L400 10" pathLength={1} />
              </svg>
              <div className={s.pin} data-pin data-cam-target="pin" aria-hidden="true">
                <span className={s.ring} />
                <span className={s.ring} />
                <span className={s.ring} />
                <svg viewBox="0 0 48 48" focusable="false">
                  <path d="M24 2C14 2 7 9.6 7 19c0 12.5 17 27 17 27s17-14.5 17-27C41 9.6 34 2 24 2z" fill="#ff4a1c" />
                  <circle cx="24" cy="19" r="7" fill="#fff6e8" />
                </svg>
              </div>
              <span className={s.pinLabel} data-pin-label>
                Tu negocio
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import s from "./scenes.module.css";

const PASOS = [
  { titulo: "Boceto gratis", texto: "Te mostramos cómo se vería tu página antes de que pagues nada." },
  { titulo: "Lo ajustamos juntos", texto: "Cambiamos textos, fotos y colores hasta que quede como tú quieres." },
  { titulo: "Publicamos", texto: "Tu página queda en línea, lista para compartir y para que te encuentren." },
  { titulo: "Te acompañamos cada mes", texto: "Hacemos cambios y te damos soporte por WhatsApp." },
];

export function SceneProceso() {
  return (
    <section data-scene="proceso" id="proceso" className={s.scene} aria-labelledby="proceso-titulo">
      <div data-stage className={s.stage} style={{ alignContent: "center" }}>
        <div className={s.bg} aria-hidden="true">
          <div data-glow className={`glow glow--ember glow--breathe ${s.glowA}`} />
        </div>
        <div>
          <div className={s.procesoHead}>
            <p className={`t-body ${s.label}`} data-anim>Cómo trabajamos</p>
            <h2 id="proceso-titulo" className="t-title" data-split>
              De la idea a tu página en <em className="hl">4 pasos</em>
            </h2>
          </div>
          <div className={s.trackViewport}>
            <div className={s.progress} aria-hidden="true">
              <span data-progress />
            </div>
            <ol className={s.track} data-track>
              {PASOS.map((p, i) => (
                <li key={p.titulo} className={s.step} data-step>
                  <span className={`t-display ${s.stepNum}`} data-step-num aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className="t-title" data-split>
                    <span className="sr-only">Paso {i + 1}: </span>
                    {p.titulo}
                  </h3>
                  <p className="muted" data-anim>
                    {p.texto}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

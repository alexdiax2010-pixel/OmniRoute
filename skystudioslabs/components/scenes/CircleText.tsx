import s from "./scenes.module.css";

/** Texto circular girando alrededor de un círculo brillante (decorativo). */
export function CircleText({ texto = "BOCETO GRATIS • SKY STUDIOS LABS • " }: { texto?: string }) {
  return (
    <div className={s.circle} data-circle aria-hidden="true">
      <div className={s.circleCore} />
      <svg viewBox="0 0 200 200" focusable="false">
        <defs>
          <path id="circulo-texto" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text>
          <textPath href="#circulo-texto" textLength="485" lengthAdjust="spacing">
            {texto}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

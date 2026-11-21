import s from "./scenes.module.css";

const CHAT: Array<{ de: "cliente" | "bot"; texto: string }> = [
  { de: "cliente", texto: "¿Siguen abiertos? Quiero agendar para mañana." },
  { de: "bot", texto: "¡Hola! Te ayudo. Tengo espacio a las 10:00 o a las 12:00. ¿Cuál prefieres?" },
  { de: "cliente", texto: "La de las 10, porfa." },
  { de: "bot", texto: "Listo, quedó apartada. Te esperamos mañana a las 10:00." },
];

export function SceneChatbot() {
  return (
    <section data-scene="chatbot" className={s.scene} aria-labelledby="chatbot-titulo">
      <div data-stage className={s.stage}>
        <div data-cam className={s.camera}>
          <div className={s.bg} aria-hidden="true">
            <div data-glow className={`glow glow--electric glow--breathe ${s.glowB}`} />
          </div>
          <div className={`${s.inner} ${s.split}`}>
            <div className={s.copy}>
              <p className={`t-body ${s.label}`} data-anim>Servicio 4 · Chatbot</p>
              <h2 id="chatbot-titulo" className="t-title" data-split>
                Un chatbot que <em className="hl hl--blue">responde</em> a las 3 AM
              </h2>
              <p className="muted" data-anim>
                Tu WhatsApp contesta preguntas frecuentes, horarios y citas aunque estés dormido o atendiendo a
                otro cliente.
              </p>
            </div>
            <div className={s.chatWrap}>
              <div className={s.clock} data-cam-target="clock">
                <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                  <circle className={s.clockFace} cx="50" cy="50" r="46" />
                  {Array.from({ length: 12 }, (_, i) => (
                    <line
                      key={i}
                      x1="50"
                      y1="8"
                      x2="50"
                      y2="13"
                      style={{ stroke: "var(--c-electric)" }}
                      strokeWidth="2"
                      transform={`rotate(${i * 30} 50 50)`}
                    />
                  ))}
                  <line data-hand-hour className={s.hand} x1="50" y1="50" x2="50" y2="28" strokeWidth="4" transform="rotate(90 50 50)" />
                  <line data-hand-min className={`${s.hand} ${s.handMin}`} x1="50" y1="50" x2="50" y2="16" strokeWidth="3" />
                  <circle cx="50" cy="50" r="3" style={{ fill: "var(--c-text)" }} />
                </svg>
                <p className={`t-title ${s.digital}`}>
                  <time data-clock dateTime="03:00">
                    03:00
                  </time>
                </p>
              </div>
              <figure>
                <ul className={s.chat}>
                  {CHAT.map((m, i) => (
                    <li key={i} data-bubble className={`${s.bubble} ${m.de === "bot" ? s.bubbleOut : s.bubbleIn}`}>
                      <span className="sr-only">{m.de === "bot" ? "Chatbot: " : "Cliente: "}</span>
                      {m.texto}
                    </li>
                  ))}
                </ul>
                <figcaption className="muted" style={{ marginTop: 12 }}>
                  Conversación de ejemplo
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

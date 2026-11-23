import { LeadForm } from "@/components/forms/LeadForm";
import { SITIO, formatoTelefono, linkWhatsApp, whatsappConfigurado } from "@/config/sitio";
import s from "./scenes.module.css";

export function SceneCierre() {
  const wa = linkWhatsApp();
  return (
    <section data-scene="cierre" className={s.scene} aria-labelledby="cierre-titulo">
      <div data-stage className={s.stage}>
        <div data-cam className={s.camera}>
          <div className={s.bg} aria-hidden="true">
            <div data-glow className={`glow glow--ember glow--breathe ${s.glowA}`} />
          </div>
          <div className={`${s.inner} ${s.cierre}`}>
            <h2 id="cierre-titulo" className="t-display" data-split="display">
              ¿Sigues <em className="hl">solo</em> en esto?
            </h2>
            <p className="muted" data-anim>
              Platícame de tu negocio y te preparo un boceto gratis, sin compromiso.
            </p>
            <a
              className={`btn btn-wa ${s.waBig}`}
              href={wa}
              data-cam-target="wa"
              data-wa
              aria-label="Escríbeme por WhatsApp"
              {...(whatsappConfigurado ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <span className="t-title">Escríbeme →</span>
            </a>
            <p className="muted" data-anim>
              o llámanos al{" "}
              <a href={`tel:+${SITIO.telefono}`} data-llamar>
                {formatoTelefono(SITIO.telefono)}
              </a>
            </p>
            {!whatsappConfigurado ? (
              <p className="muted">
                <span className="placeholder">[MI_WHATSAPP]</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className={s.after}>
        <div id="contacto" className={s.contacto}>
          <h3 className="t-title" data-split>
            ¿Prefieres que te <em className="hl">contactemos</em>?
          </h3>
          <p className="muted">Déjanos tus datos y te escribimos para tu boceto gratis.</p>
          <LeadForm origen="home" />
        </div>
      </div>
    </section>
  );
}

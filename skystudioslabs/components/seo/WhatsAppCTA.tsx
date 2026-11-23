import { linkWhatsApp, SITIO } from "@/config/sitio";
import { Contactos } from "@/components/chrome/Contactos";
import { IconoWhatsApp } from "@/components/chrome/IconoWhatsApp";
import { Hl } from "./Hl";
import s from "./seo.module.css";

type Props = {
  titulo?: string;
  texto?: string;
  mensaje?: string;
  boton?: string;
  children?: React.ReactNode;
};

/** Bloque de cierre con el CTA principal: boceto gratis por WhatsApp. */
export function WhatsAppCTA({
  titulo = "Pide tu boceto *gratis*",
  texto = "Mándanos un WhatsApp con el nombre de tu negocio y a qué te dedicas. Te enseñamos cómo podría verse tu página antes de que pagues nada.",
  mensaje = SITIO.mensajeWhatsApp,
  boton = "Quiero mi boceto gratis",
  children,
}: Props) {
  return (
    <section className={`section ${s.cta}`} aria-labelledby="cta-titulo">
      <div className={`glow glow--ember glow--breathe ${s.ctaGlow}`} aria-hidden="true" />
      <div className={`container ${s.ctaInner}`}>
        <h2 className="t-title" id="cta-titulo">
          <Hl texto={titulo} />
        </h2>
        <p className={`muted ${s.ctaTexto}`}>{texto}</p>
        <a className="btn btn-wa" href={linkWhatsApp(mensaje)} target="_blank" rel="noopener noreferrer">
          <IconoWhatsApp />
          {boton}
        </a>
        <Contactos mensaje={mensaje} />
        {children}
      </div>
    </section>
  );
}

import Link from "next/link";
import { SITIO, linkWhatsApp } from "@/config/sitio";
import { Contactos } from "./Contactos";
import { PAGINAS_GIRO, PAGINAS_SERVICIO } from "@/lib/seo/paginas";
import { LogoSol } from "./LogoSol";
import s from "./chrome.module.css";

/** true si el valor ya no es un marcador tipo "[MI_CORREO]". */
const configurado = (v: string) => !/^\[.*\]$/.test(v);

function urlRed(red: "instagram" | "facebook", valor: string): string {
  if (/^https?:\/\//.test(valor)) return valor;
  const usuario = valor.replace(/^@/, "");
  return red === "instagram" ? `https://www.instagram.com/${usuario}` : `https://www.facebook.com/${usuario}`;
}

export function Footer() {
  const wa = linkWhatsApp();
  const anio = new Date().getFullYear();
  return (
    <footer className={s.footer}>
      <div className={`glow glow--ember ${s.footerGlow}`} aria-hidden="true" />
      <div className={`container ${s.footerGrid}`}>
        <div className={s.footerMarca}>
          <Link href="/" className={s.logo} aria-label="Sky Studios Labs, ir al inicio">
            <LogoSol className={s.logoSol} />
            <span aria-hidden="true">SKY STUDIOS LABS</span>
          </Link>
          <p className="muted">
            Páginas web, Google Maps, redes sociales y chatbots de WhatsApp para negocios de todo México.
          </p>
          <a className="btn btn-primary" href={wa} target="_blank" rel="noopener noreferrer">
            Pide tu boceto gratis
          </a>
        </div>

        <nav aria-label="Servicios">
          <p className={s.footerTitulo}>Servicios</p>
          <ul className={s.footerLista}>
            {PAGINAS_SERVICIO.map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}`}>{p.titulo}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Páginas por giro">
          <p className={s.footerTitulo}>Por giro</p>
          <ul className={s.footerLista}>
            {PAGINAS_GIRO.map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}`}>Páginas web para {p.menu.toLowerCase()}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className={s.footerTitulo}>Contacto</p>
          <ul className={s.footerLista}>
            <Contactos variante="lista" />
            {/* Correo y redes sólo si ya están configurados: nunca mostrar marcadores al público. */}
            {configurado(SITIO.correo) ? (
              <li>
                <a href={`mailto:${SITIO.correo}`}>{SITIO.correo}</a>
              </li>
            ) : null}
            <li className="muted">Atendemos negocios en todo México</li>
          </ul>
          <p className={s.footerTitulo} style={{ marginTop: 24 }}>
            Redes
          </p>
          <ul className={s.footerLista}>
            {(["instagram", "facebook"] as const)
              .filter((red) => configurado(SITIO.redes[red]))
              .map((red) => (
                <li key={red}>
                  <a href={urlRed(red, SITIO.redes[red])} target="_blank" rel="noopener noreferrer">
                    {red === "instagram" ? "Instagram" : "Facebook"}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      </div>
      <div className={`container ${s.footerBase}`}>
        <p>
          © {anio} {SITIO.nombre}. México.
        </p>
        <p>Hecho en México para negocios de todo el país.</p>
      </div>
    </footer>
  );
}

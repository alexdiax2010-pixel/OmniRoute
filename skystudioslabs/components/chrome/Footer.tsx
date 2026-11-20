import Link from "next/link";
import { SITIO, linkWhatsApp } from "@/config/sitio";
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
            Páginas web, Google Maps, redes sociales y chatbots de WhatsApp para negocios locales de Zapopan y Guadalajara.
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
            <li>
              <a href={wa} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              {configurado(SITIO.correo) ? (
                <a href={`mailto:${SITIO.correo}`}>{SITIO.correo}</a>
              ) : (
                <span className="placeholder">{SITIO.correo}</span>
              )}
            </li>
            <li>
              {SITIO.ciudad}, {SITIO.region}
            </li>
            <li className="muted">Atendemos Zapopan y Guadalajara</li>
          </ul>
          <p className={s.footerTitulo} style={{ marginTop: 24 }}>
            Redes
          </p>
          <ul className={s.footerLista}>
            {(["instagram", "facebook"] as const).map((red) => {
              const valor = SITIO.redes[red];
              const nombre = red === "instagram" ? "Instagram" : "Facebook";
              return (
                <li key={red}>
                  {configurado(valor) ? (
                    <a href={urlRed(red, valor)} target="_blank" rel="noopener noreferrer">
                      {nombre}
                    </a>
                  ) : (
                    <>
                      {nombre}: <span className="placeholder">{valor}</span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className={`container ${s.footerBase}`}>
        <p>
          © {anio} {SITIO.nombre}. Zapopan, Jalisco.
        </p>
        <p>Hecho en Jalisco para negocios locales.</p>
      </div>
    </footer>
  );
}

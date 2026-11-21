import Link from "next/link";
import { linkWhatsApp } from "@/config/sitio";
import { PAGINAS_GIRO, PAGINAS_SERVICIO } from "@/lib/seo/paginas";
import { LogoSol } from "./LogoSol";
import { NavDetails } from "./NavDetails";
import s from "./chrome.module.css";

const ANCLAS = [
  { href: "/#precios", texto: "Precios" },
  { href: "/#proceso", texto: "Proceso" },
  { href: "/#clientes", texto: "Clientes" },
];

function ListaPaginas({ paginas }: { paginas: typeof PAGINAS_SERVICIO }) {
  return (
    <ul className={s.panelLista}>
      {paginas.map((p) => (
        <li key={p.slug}>
          <Link className={s.panelLink} href={`/${p.slug}`}>
            {p.menu}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Header() {
  const wa = linkWhatsApp();
  return (
    <header className={s.header}>
      <div className={`container ${s.bar}`}>
        <Link href="/" className={s.logo} aria-label="Sky Studios Labs, ir al inicio">
          <LogoSol className={s.logoSol} />
          <span aria-hidden="true">SKY STUDIOS LABS</span>
        </Link>

        <nav className={s.navDesktop} aria-label="Principal">
          <ul className={s.navLista}>
            <li>
              <NavDetails etiqueta="Servicios" className={s.desplegable} summaryClassName={s.summary} panelClassName={s.panel}>
                <ListaPaginas paginas={PAGINAS_SERVICIO} />
              </NavDetails>
            </li>
            <li>
              <NavDetails etiqueta="Giros" className={s.desplegable} summaryClassName={s.summary} panelClassName={s.panel}>
                <ListaPaginas paginas={PAGINAS_GIRO} />
              </NavDetails>
            </li>
            {ANCLAS.map((a) => (
              <li key={a.href}>
                <Link className={s.navLink} href={a.href}>
                  {a.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <a className={`btn btn-primary ${s.cta} ${s.ctaHeader}`} href={wa} target="_blank" rel="noopener noreferrer">
          Boceto gratis
        </a>

        <NavDetails
          etiqueta="Menú"
          className={s.movil}
          summaryClassName={`${s.summary} ${s.movilSummary}`}
          panelClassName={s.movilPanel}
        >
          <nav aria-label="Menú móvil">
            <div className={s.movilGrupo}>
              <p className={s.movilTitulo}>Servicios</p>
              <ListaPaginas paginas={PAGINAS_SERVICIO} />
            </div>
            <div className={s.movilGrupo}>
              <p className={s.movilTitulo}>Giros</p>
              <ListaPaginas paginas={PAGINAS_GIRO} />
            </div>
            <div className={s.movilGrupo}>
              <ul className={s.panelLista}>
                {ANCLAS.map((a) => (
                  <li key={a.href}>
                    <Link className={s.panelLink} href={a.href}>
                      {a.texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <a className={`btn btn-primary ${s.movilCta}`} href={wa} target="_blank" rel="noopener noreferrer">
              Boceto gratis por WhatsApp
            </a>
          </nav>
        </NavDetails>
      </div>
    </header>
  );
}

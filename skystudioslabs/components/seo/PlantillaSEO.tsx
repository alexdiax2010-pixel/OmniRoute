import Link from "next/link";
import { linkWhatsApp } from "@/config/sitio";
import { obtenerPagina, PAGINAS_GIRO, PAGINAS_SERVICIO } from "@/lib/seo/paginas";
import { schemasPagina } from "@/lib/seo/metadata";
import { LeadForm } from "@/components/forms/LeadForm";
import { IconoWhatsApp } from "@/components/chrome/IconoWhatsApp";
import { JsonLd } from "./JsonLd";
import { Hl } from "./Hl";
import { Encabezado } from "./Encabezado";
import { ExampleShowcase } from "./ExampleShowcase";
import { ProcessSteps } from "./ProcessSteps";
import { PricingTable } from "./PricingTable";
import { ReviewsPlaceholder } from "./ReviewsPlaceholder";
import { FAQ } from "./FAQ";
import { WhatsAppCTA } from "./WhatsAppCTA";
import s from "./seo.module.css";

/** Plantilla única para las 8 páginas SEO (servicios y giros). El contenido vive en lib/seo/paginas.ts. */
export function PlantillaSEO({ slug }: { slug: string }) {
  const p = obtenerPagina(slug);
  const wa = linkWhatsApp(p.mensajeWhatsApp);
  const relacionadas = (p.tipo === "servicio" ? PAGINAS_SERVICIO : PAGINAS_GIRO).filter((x) => x.slug !== p.slug);
  const otras = p.tipo === "servicio" ? PAGINAS_GIRO : PAGINAS_SERVICIO;

  return (
    <>
      {schemasPagina(p).map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}

      {/* ---------- Hero ---------- */}
      <section className={s.hero} aria-labelledby="pagina-titulo">
        <div className={`glow glow--ember glow--breathe ${s.heroGlow}`} aria-hidden="true" />
        <div className={`container ${s.heroInner}`}>
          <nav aria-label="Migas de pan" className={s.migas}>
            <ol>
              <li>
                <Link href="/">Inicio</Link>
              </li>
              <li aria-current="page">{p.menu}</li>
            </ol>
          </nav>
          <p className={s.antetitulo}>{p.antetitulo}</p>
          <h1 className={`t-display ${s.h1}`} id="pagina-titulo">
            <Hl texto={p.h1} />
          </h1>
          <p className={s.intro}>{p.intro}</p>
          <div className={s.acciones}>
            <a className="btn btn-primary" href={wa} target="_blank" rel="noopener noreferrer">
              <IconoWhatsApp />
              Boceto gratis por WhatsApp
            </a>
            <a className="btn btn-ghost" href="#precios">
              Ver precios
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Ejemplo visual ---------- */}
      <section className={s.seccionEjemplo} aria-labelledby="ejemplo-titulo">
        <div className="container">
          <h2 className="sr-only" id="ejemplo-titulo">
            Ejemplo de diseño
          </h2>
          <ExampleShowcase variante={p.ejemplo} />
        </div>
      </section>

      {/* ---------- Problemas ---------- */}
      <section className="section" aria-labelledby="problemas-titulo">
        <div className="container">
          <Encabezado antetitulo="El problema" titulo={p.problemasTitulo} id="problemas-titulo" />
          <ul className={s.bloques}>
            {p.problemas.map((b) => (
              <li key={b.titulo} className={`card ${s.bloque}`}>
                <h3 className={s.bloqueTitulo}>{b.titulo}</h3>
                <p className="muted">{b.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Qué incluye ---------- */}
      <section className="section" aria-labelledby="incluye-titulo">
        <div className="container">
          <Encabezado antetitulo="La solución" titulo={p.incluyeTitulo} id="incluye-titulo" />
          <ul className={s.incluye}>
            {p.incluye.map((b) => (
              <li key={b.titulo} className={s.incluyeItem}>
                <h3 className={s.bloqueTitulo}>{b.titulo}</h3>
                <p className="muted">{b.texto}</p>
              </li>
            ))}
          </ul>
          {p.nota ? <p className={`card ${s.nota}`}>{p.nota}</p> : null}
          <div className={s.acciones}>
            <a className="btn btn-primary" href={wa} target="_blank" rel="noopener noreferrer">
              Quiero mi boceto gratis
            </a>
          </div>
        </div>
      </section>

      <ProcessSteps />
      <PricingTable
        titulo={p.tipo === "giro" ? "Precios para tu *página*" : "Precios *claros*, sin letras chiquitas"}
      />
      <ReviewsPlaceholder />
      <FAQ faqs={p.faqs} />

      {/* ---------- Enlaces internos ---------- */}
      <section className="section" aria-labelledby="relacionadas-titulo">
        <div className="container">
          <Encabezado antetitulo="Sigue explorando" titulo="También te puede *servir*" id="relacionadas-titulo" />
          <div className={s.relacionadas}>
            <div>
              <h3 className={s.bloqueTitulo}>{p.tipo === "servicio" ? "Otros servicios" : "Otros giros"}</h3>
              <ul className={s.listaLinks}>
                {relacionadas.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/${r.slug}`}>{r.titulo}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className={s.bloqueTitulo}>{p.tipo === "servicio" ? "Páginas por giro" : "Servicios"}</h3>
              <ul className={s.listaLinks}>
                {otras.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/${r.slug}`}>{r.titulo}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <WhatsAppCTA mensaje={p.mensajeWhatsApp}>
        <div className={s.formulario}>
          <p className="muted">¿Prefieres que te contactemos nosotros? Déjanos tus datos:</p>
          <LeadForm origen={`seo:${p.slug}`} />
        </div>
      </WhatsAppCTA>
    </>
  );
}

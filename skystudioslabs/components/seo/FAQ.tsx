import type { FAQ as Pregunta } from "@/lib/seo/schema";
import { Encabezado } from "./Encabezado";
import s from "./seo.module.css";

/** Preguntas frecuentes con <details> nativo (accesible sin JS). El FAQPage JSON-LD va aparte. */
export function FAQ({ faqs, titulo = "Preguntas *frecuentes*" }: { faqs: Pregunta[]; titulo?: string }) {
  return (
    <section className="section" aria-labelledby="faq-titulo">
      <div className="container">
        <Encabezado antetitulo="Dudas" titulo={titulo} id="faq-titulo" />
        <div className={s.faq}>
          {faqs.map((f) => (
            <details key={f.pregunta} className={s.faqItem}>
              <summary className={s.faqPregunta}>{f.pregunta}</summary>
              <p className={`muted ${s.faqRespuesta}`}>{f.respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

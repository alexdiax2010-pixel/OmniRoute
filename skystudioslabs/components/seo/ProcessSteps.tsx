import { Encabezado } from "./Encabezado";
import s from "./seo.module.css";

export const PASOS = [
  {
    titulo: "Boceto gratis",
    texto: "Nos cuentas de tu negocio por WhatsApp y te enseñamos un boceto de tu página. Sin costo y sin compromiso.",
  },
  {
    titulo: "Lo ajustamos juntos",
    texto: "Revisamos textos, fotos y colores contigo hasta que la página se sienta tuya.",
  },
  {
    titulo: "Publicamos",
    texto: "Tu página queda en línea con tu propio link, conectada a tu WhatsApp y a Google Maps.",
  },
  {
    titulo: "Te acompañamos cada mes",
    texto: "Con el mantenimiento mensual hacemos cambios, revisamos que todo funcione y te ayudamos por WhatsApp.",
  },
] as const;

export function ProcessSteps({ id = "proceso" }: { id?: string }) {
  const tituloId = `${id}-titulo`;
  return (
    <section className="section" id={id} aria-labelledby={tituloId}>
      <div className="container">
        <Encabezado antetitulo="Cómo trabajamos" titulo="Cuatro pasos, *cero* complicaciones" id={tituloId} />
        <ol className={s.pasos}>
          {PASOS.map((p, i) => (
            <li key={p.titulo} className={s.paso}>
              <span className={`t-title ${s.pasoNum}`} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className={s.pasoTitulo}>
                <span className="sr-only">Paso {i + 1}: </span>
                {p.titulo}
              </h3>
              <p className="muted">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

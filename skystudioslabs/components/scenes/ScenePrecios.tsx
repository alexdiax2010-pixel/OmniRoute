import { MANTENIMIENTO, PAQUETES, formatoPrecio } from "@/config/precios";
import s from "./scenes.module.css";

function Precio({ valor, sufijo }: { valor: number | null; sufijo?: string }) {
  const txt = formatoPrecio(valor);
  return (
    <>
      {valor == null ? (
        // Sin monto real configurado: nada de marcadores en público, se cotiza con el boceto.
        <p className={s.priceCotiza}>Precio según tu negocio: te lo damos junto con tu boceto gratis.</p>
      ) : (
        <p className={`t-title ${s.price}`}>{txt}</p>
      )}
      {sufijo ? <p className="muted">{sufijo}</p> : null}
    </>
  );
}

export function ScenePrecios() {
  const conPrecios = PAQUETES.every((p) => p.precio != null);
  return (
    <section data-scene="precios" id="precios" className={s.scene} aria-labelledby="precios-titulo">
      <div data-stage className={s.stage}>
        <div data-cam className={s.camera}>
          <div className={s.bg} aria-hidden="true">
            <div data-glow className={`glow glow--ember glow--breathe ${s.glowB}`} />
          </div>
          <div className={s.inner}>
            <p className={`t-body ${s.label}`} data-anim>Paquetes</p>
            <h2 id="precios-titulo" className="t-title" data-split>
              {conPrecios ? "Precios" : "Paquetes"} <em className="hl">claros</em>, sin letras chiquitas
            </h2>
            <p className="muted" data-anim style={{ marginTop: 16 }}>
              Pago único por tu página y, si quieres, mantenimiento mensual. Antes de todo: tu boceto es gratis.
            </p>
            <div className={`grid grid-3 ${s.plans}`}>
              {PAQUETES.map((p) => (
                <article
                  key={p.id}
                  className={`card ${s.plan} ${p.destacado ? s.planFeatured : ""}`}
                  data-plan
                  data-cam-target={p.destacado ? "featured" : undefined}
                >
                  {p.destacado ? <span className={s.planTag}>Recomendado</span> : null}
                  <h3 className="t-title">{p.nombre}</h3>
                  <Precio valor={p.precio} />
                  <p className="muted">{p.nota}</p>
                  <ul>
                    {p.incluye.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <a className={`btn ${p.destacado ? "btn-primary" : "btn-ghost"}`} href="#contacto">
                    Pedir boceto gratis
                  </a>
                </article>
              ))}
            </div>
            <article className={`card ${s.maint}`} data-plan>
              <div>
                <h3 className="t-title">{MANTENIMIENTO.nombre}</h3>
                <Precio valor={MANTENIMIENTO.precio} sufijo="al mes" />
              </div>
              <ul>
                {MANTENIMIENTO.incluye.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

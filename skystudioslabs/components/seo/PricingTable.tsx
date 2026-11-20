import { PAQUETES, MANTENIMIENTO, formatoPrecio } from "@/config/precios";
import { linkWhatsApp } from "@/config/sitio";
import { Encabezado } from "./Encabezado";
import s from "./seo.module.css";

type Props = { titulo?: string; antetitulo?: string; id?: string };

/** Tabla de paquetes leída de config/precios.ts. Precio null → marcador "[PRECIO]". */
export function PricingTable({ titulo = "Precios *claros*, sin letras chiquitas", antetitulo = "Paquetes", id = "precios" }: Props) {
  const tituloId = `${id}-titulo`;
  return (
    <section className="section" id={id} aria-labelledby={tituloId}>
      <div className="container">
        <Encabezado antetitulo={antetitulo} titulo={titulo} id={tituloId}>
          Pago único por tu página. El boceto es gratis: lo ves antes de decidir.
        </Encabezado>
        <ul className={s.precios}>
          {PAQUETES.map((p) => {
            const precio = formatoPrecio(p.precio);
            return (
              <li key={p.id} className={`${s.precio} ${p.destacado ? s.precioDestacado : ""}`}>
                {p.destacado ? <p className={s.precioSello}>El más elegido</p> : null}
                <h3 className="t-title">{p.nombre}</h3>
                <p className={s.precioMonto}>
                  <span className={p.precio == null ? "placeholder" : s.precioCifra}>{precio}</span>{" "}
                  <span className="muted">MXN · {p.nota}</span>
                </p>
                <ul className={s.checks}>
                  {p.incluye.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <a
                  className={`btn ${p.destacado ? "btn-primary" : "btn-ghost"} ${s.precioBtn}`}
                  href={linkWhatsApp(`Hola, me interesa el paquete ${p.nombre}. ¿Me hacen mi boceto gratis?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Quiero el {p.nombre}
                </a>
              </li>
            );
          })}
        </ul>
        <div className={`card ${s.mantenimiento}`}>
          <div>
            <h3 className="t-title">{MANTENIMIENTO.nombre}</h3>
            <p className="muted">Opcional, para que tu página siga al día.</p>
          </div>
          <ul className={s.checks}>
            {MANTENIMIENTO.incluye.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className={s.precioMonto}>
            <span className={MANTENIMIENTO.precio == null ? "placeholder" : s.precioCifra}>
              {formatoPrecio(MANTENIMIENTO.precio)}
            </span>{" "}
            <span className="muted">MXN al mes</span>
          </p>
        </div>
      </div>
    </section>
  );
}

import { requerirCliente } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { PAQUETES, NOMBRE_SERVICIO, MANTENIMIENTO, type Servicio } from "@/config/precios";
import { formatoMXN, proximoCobro } from "@/lib/crm/metricas";
import { fechaCorta, hoyMX } from "@/lib/crm/fechas";
import { urlCliente } from "@/lib/crm/enlaces";
import { PedirCambio } from "./_componentes/PedirCambio";
import s from "../portal.module.css";

export const metadata = { title: "Mi portal" };

/** Solo datos del cliente de la sesión. No se muestran teléfonos ni datos internos de venta. */
export default async function Portal() {
  const sesion = await requerirCliente();
  const repo = await getRepo();
  const p = await repo.obtenerProspecto(sesion.prospectoId);
  if (!p) {
    return (
      <div className={s.card}>
        <p>No encontramos tu cuenta. Escríbenos por WhatsApp y lo revisamos.</p>
      </div>
    );
  }
  const sitio = (await repo.listarSitios()).find((x) => x.prospecto_id === sesion.prospectoId && x.tipo === "cliente" && x.activo);
  const paquete = PAQUETES.find((x) => x.id === p.paquete);
  const cobro = proximoCobro(p.diaCobro, hoyMX());

  return (
    <>
      <h1 className={s.titulo}>
        Hola, <em>{p.nombre}</em>
      </h1>

      <section className={s.card} aria-labelledby="pagina">
        <h2 id="pagina" className={s.etiqueta}>
          Tu página
        </h2>
        {sitio ? (
          <a className={s.enlace} href={sitio.dominio_propio ? `https://${sitio.dominio_propio}` : urlCliente(sitio.slug)} target="_blank" rel="noopener noreferrer">
            {sitio.dominio_propio ?? urlCliente(sitio.slug).replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <p className={s.muted}>Tu página está en preparación. Te avisamos en cuanto esté publicada.</p>
        )}
      </section>

      <section className={s.card} aria-labelledby="plan">
        <h2 id="plan" className={s.etiqueta}>
          Tu plan
        </h2>
        <p>
          <strong>{paquete?.nombre ?? "Plan personalizado"}</strong>
          {p.mensualidad != null ? ` · ${MANTENIMIENTO.nombre}: ${formatoMXN(p.mensualidad)}` : ""}
        </p>
        {p.servicios.length > 0 && (
          <ul className={s.lista}>
            {p.servicios.map((x) => (
              <li key={x}>{NOMBRE_SERVICIO[x as Servicio] ?? x}</li>
            ))}
          </ul>
        )}
        <p className={s.muted}>Próximo cobro: {cobro ? fechaCorta(cobro) : "—"}</p>
      </section>

      <section className={s.card} aria-labelledby="cambio">
        <h2 id="cambio" className={s.etiqueta}>
          Pedir un cambio
        </h2>
        <PedirCambio />
      </section>
    </>
  );
}

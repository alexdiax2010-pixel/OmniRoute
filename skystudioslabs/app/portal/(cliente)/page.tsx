import { requerirCliente } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { PAQUETES, NOMBRE_SERVICIO, MANTENIMIENTO, type Servicio } from "@/config/precios";
import { formatoMXN, proximoCobro } from "@/lib/crm/metricas";
import { fechaCorta, fechaHora, hoyMX } from "@/lib/crm/fechas";
import { sitioDelCliente, solicitudesPortal, tienePlan, vistaPortal } from "@/lib/portal/vista";
import { urlCliente } from "@/lib/crm/enlaces";
import { PedirCambio } from "./_componentes/PedirCambio";
import s from "../portal.module.css";

export const metadata = { title: "Mi portal" };

/** Solo datos del cliente de la sesión. No se muestran teléfonos ni datos internos de venta. */
export default async function Portal() {
  const sesion = await requerirCliente();
  const repo = await getRepo();
  const fila = await repo.obtenerProspecto(sesion.prospectoId);
  if (!fila) {
    return (
      <div className={s.card} role="alert">
        <p>No encontramos los datos de tu cuenta. Escríbenos por WhatsApp y lo revisamos.</p>
      </div>
    );
  }
  // Solo la parte "de cliente": nada interno de venta llega al render.
  const p = vistaPortal(fila);
  const sitio = sitioDelCliente(await repo.listarSitios(), sesion.prospectoId);
  let solicitudes: ReturnType<typeof solicitudesPortal> | null = null;
  try {
    solicitudes = solicitudesPortal(await repo.listarSolicitudes(sesion.prospectoId), sesion.prospectoId);
  } catch {
    solicitudes = null; // si falla, el resto del portal sigue funcionando
  }
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
        {tienePlan(p) ? (
          <>
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
          </>
        ) : (
          <p className={s.muted}>Aún no registramos los detalles de tu plan. Si tienes dudas, escríbenos por WhatsApp.</p>
        )}
      </section>

      <section className={s.card} aria-labelledby="cambio">
        <h2 id="cambio" className={s.etiqueta}>
          Pedir un cambio
        </h2>
        <PedirCambio />
      </section>

      <section className={s.card} aria-labelledby="historial">
        <h2 id="historial" className={s.etiqueta}>
          Tus solicitudes
        </h2>
        {solicitudes === null ? (
          <p className={s.muted}>No pudimos cargar tus solicitudes en este momento. Inténtalo más tarde.</p>
        ) : solicitudes.length === 0 ? (
          <p className={s.muted}>Todavía no has pedido cambios. Cuando lo hagas, aparecerán aquí.</p>
        ) : (
          <ul className={s.lista}>
            {solicitudes.map((x) => (
              <li key={x.id}>
                <span className={s.muted}>{fechaHora(x.creado)}</span> — {x.texto}
                {x.conFoto ? " (con foto)" : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

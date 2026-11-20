import Link from "next/link";
import { requerirAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { PAQUETES, NOMBRE_SERVICIO, type Servicio } from "@/config/precios";
import { formatoMXN, proximoCobro, serviciosPorOfrecer } from "@/lib/crm/metricas";
import { fechaCorta, hoyMX } from "@/lib/crm/fechas";
import { urlCliente } from "@/lib/crm/enlaces";
import s from "../../admin.module.css";

export const metadata = { title: "Clientes" };

export default async function Clientes() {
  await requerirAdmin();
  const repo = await getRepo();
  const [lista, sitios] = await Promise.all([repo.listarProspectos(), repo.listarSitios()]);
  const hoy = hoyMX();
  const clientes = lista
    .filter((p) => p.etapa === "Ganado")
    .map((p) => ({ p, cobro: proximoCobro(p.diaCobro, hoy), sitio: sitios.find((x) => x.prospecto_id === p.id && x.tipo === "cliente") }))
    .sort((a, b) => (a.cobro ?? "9999") .localeCompare(b.cobro ?? "9999"));

  return (
    <>
      <h1 className={s.titulo}>
        Clientes <em>{clientes.length}</em>
      </h1>
      <div className={s.tablaWrap}>
        <table className={s.tabla}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Plan</th>
              <th>Mensualidad</th>
              <th>Próximo cobro</th>
              <th>Servicios</th>
              <th>Puedes ofrecerle</th>
              <th>Sitio</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(({ p, cobro, sitio }) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/prospectos/${encodeURIComponent(p.id)}`}>{p.nombre}</Link>
                </td>
                <td>{PAQUETES.find((x) => x.id === p.paquete)?.nombre ?? p.paquete ?? "—"}</td>
                <td>{formatoMXN(p.mensualidad)}</td>
                <td className={cobro === hoy ? s.hoy : undefined}>{cobro ? fechaCorta(cobro) : <span className={s.muted}>Sin día de cobro</span>}</td>
                <td>{p.servicios.length ? p.servicios.map((x) => NOMBRE_SERVICIO[x as Servicio] ?? x).join(", ") : "—"}</td>
                <td className={s.ok}>{serviciosPorOfrecer(p.servicios).join(", ") || "—"}</td>
                <td>
                  {sitio ? (
                    <a href={urlCliente(sitio.slug)} target="_blank" rel="noopener noreferrer">
                      {sitio.slug}
                    </a>
                  ) : (
                    <span className={s.muted}>Sin publicar</span>
                  )}
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={7} className={s.muted}>
                  Aún no hay clientes ganados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

import Link from "next/link";
import { requerirAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { ETAPAS } from "@/lib/types";
import { calcularMetricas, formatoMXN, formatoTasa } from "@/lib/crm/metricas";
import { seguimientosPendientes, seguimientosProximos, estadoSeguimiento } from "@/lib/crm/reglas";
import { hoyMX, fechaCorta, sumarDias } from "@/lib/crm/fechas";
import { ORDENES, aQuery, filtrarYOrdenar, hayFiltros, leerFiltros, type FiltrosLista, type Orden } from "@/lib/crm/lista";
import s from "../admin.module.css";

export const metadata = { title: "Prospectos" };

const ETIQUETA: Record<Orden, string> = { puntaje: "Puntaje", nombre: "Nombre", etapa: "Etapa", seguimiento: "Seguimiento", colonia: "Colonia" };

function url(f: FiltrosLista, cambios: Partial<Record<keyof FiltrosLista, string | null>>) {
  const qs = aQuery(f, cambios);
  return qs ? `/admin?${qs}` : "/admin";
}

export default async function Prospectos({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requerirAdmin();
  const repo = await getRepo();
  const todos = await repo.listarProspectos();
  const hoy = hoyMX();
  const f = leerFiltros(await searchParams);
  const lista = filtrarYOrdenar(todos, f);
  const m = calcularMetricas(todos, hoy);
  const pendientes = seguimientosPendientes(todos, hoy);
  const proximos = seguimientosProximos(todos, hoy, sumarDias(hoy, 7));
  const categorias = [...new Set(todos.map((p) => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  const filtrado = hayFiltros(f);

  return (
    <>
      <h1 className={s.titulo}>
        Prospectos <em>{todos.length}</em>
      </h1>

      <section aria-label="Métricas" className={s.kpis}>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>Vendido este mes</div>
          <div className={`${s.kpiValor} ${s.ember}`}>{formatoMXN(m.vendidoMes)}</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>Ingreso recurrente / mes</div>
          <div className={s.kpiValor}>{formatoMXN(m.recurrenteMensual)}</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>En negociación</div>
          <div className={s.kpiValor}>{formatoMXN(m.enNegociacion)}</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>Tasa de cierre</div>
          <div className={s.kpiValor}>{formatoTasa(m.tasaCierre)}</div>
          <div className={s.muted}>
            {m.ganados} ganados · {m.perdidos} perdidos
          </div>
        </div>
      </section>

      <section aria-labelledby="seg" className={`${s.card} ${pendientes.length ? s.cardEmber : ""}`} style={{ marginTop: 16 }}>
        <h2 id="seg" className={s.sub} style={{ marginTop: 0 }}>
          Seguimientos para hoy o vencidos: <span className={pendientes.length ? s.vencido : s.ok}>{pendientes.length}</span>
        </h2>
        {pendientes.length === 0 ? (
          <p className={s.muted}>Nada pendiente. ¡Bien!</p>
        ) : (
          <ul className={s.notas}>
            {pendientes.map((p) => (
              <li key={p.id} className={s.entre}>
                <Link href={`/admin/prospectos/${encodeURIComponent(p.id)}`}>{p.nombre}</Link>
                <span>
                  <span className={s.badge}>{p.etapa}</span>{" "}
                  <span className={estadoSeguimiento(p.seguimiento, hoy) === "vencido" ? s.vencido : s.hoy}>
                    {estadoSeguimiento(p.seguimiento, hoy) === "vencido" ? `Vencido ${fechaCorta(p.seguimiento)}` : "Hoy"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="prox" className={s.card} style={{ marginTop: 16 }}>
        <h2 id="prox" className={s.sub} style={{ marginTop: 0 }}>
          Próximos seguimientos (7 días): {proximos.length}
        </h2>
        {proximos.length === 0 ? (
          <p className={s.muted}>No hay seguimientos programados para esta semana. Al mover un prospecto a Contactado, Boceto enviado o Negociando se agenda uno a 3 días.</p>
        ) : (
          <ul className={s.notas}>
            {proximos.map((p) => (
              <li key={p.id} className={s.entre}>
                <Link href={`/admin/prospectos/${encodeURIComponent(p.id)}`}>{p.nombre}</Link>
                <span>
                  <span className={s.badge}>{p.etapa}</span> <span className={s.muted}>{fechaCorta(p.seguimiento)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <h2 className={s.sub}>Lista</h2>
      <form method="get" action="/admin" className={`${s.fila} ${s.filtros}`} role="search" style={{ marginBottom: 12 }}>
        <label className="sr-only" htmlFor="q">
          Buscar
        </label>
        <input id="q" name="q" defaultValue={f.q} placeholder="Buscar nombre, giro, colonia o dirección" className={s.input} style={{ maxWidth: 320 }} />
        <label className="sr-only" htmlFor="etapa">
          Etapa
        </label>
        <select id="etapa" name="etapa" defaultValue={f.etapa ?? ""} className={s.select} style={{ maxWidth: 220 }}>
          <option value="">Todas las etapas</option>
          {ETAPAS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        {categorias.length > 0 && (
          <>
            <label className="sr-only" htmlFor="categoria">
              Categoría
            </label>
            <select id="categoria" name="categoria" defaultValue={f.categoria} className={s.select} style={{ maxWidth: 200 }}>
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </>
        )}
        <label className="sr-only" htmlFor="min">
          Puntaje mínimo
        </label>
        <input id="min" name="min" type="number" min={0} max={100} defaultValue={f.min ?? ""} placeholder="Puntaje mín." className={s.input} style={{ maxWidth: 130 }} />
        <label className={s.check}>
          <input type="checkbox" name="top10" value="1" defaultChecked={f.top10} /> Top 10
        </label>
        <label className={s.check}>
          <input type="checkbox" name="tel" value="1" defaultChecked={f.tel} /> Con teléfono
        </label>
        <label className={s.check}>
          <input type="checkbox" name="boceto" value="1" defaultChecked={f.boceto} /> Con boceto
        </label>
        <input type="hidden" name="orden" value={f.orden} />
        <input type="hidden" name="dir" value={f.dir} />
        <button type="submit" className={s.btn}>
          Filtrar
        </button>
        {filtrado && (
          <Link href="/admin" className={s.btn}>
            Limpiar
          </Link>
        )}
      </form>

      <p className={`${s.muted} ${s.entre}`} style={{ marginBottom: 8 }}>
        <span>
          {lista.length} de {todos.length}
        </span>
        <a href={`/admin/exportar.csv${filtrado ? `?${aQuery(f)}` : ""}`}>{filtrado ? "Exportar esta vista (CSV)" : "Exportar todo (CSV)"}</a>
      </p>
      <div className={`${s.tablaWrap} ${s.tablaTarjetas}`}>
        <table className={s.tabla}>
          <thead>
            <tr>
              {ORDENES.map((o) => {
                const activo = f.orden === o;
                const dir = activo ? (f.dir === "asc" ? "desc" : "asc") : o === "puntaje" ? "desc" : "asc";
                return (
                  <th key={o} aria-sort={activo ? (f.dir === "asc" ? "ascending" : "descending") : "none"}>
                    <a href={url(f, { orden: o, dir })} aria-current={activo ? "true" : undefined}>
                      {ETIQUETA[o]} {activo ? (f.dir === "asc" ? "↑" : "↓") : ""}
                    </a>
                  </th>
                );
              })}
              <th>Giro</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => {
              const est = estadoSeguimiento(p.seguimiento, hoy);
              return (
                <tr key={p.id}>
                  <td>
                    {p.puntaje}
                    {p.top10 ? " ★" : ""}
                  </td>
                  <td>
                    <Link href={`/admin/prospectos/${encodeURIComponent(p.id)}`}>{p.nombre}</Link>
                    {p.boceto && (
                      <>
                        {" "}
                        <span className={s.badge}>Boceto</span>
                      </>
                    )}
                    {p.alertas.length > 0 && (
                      <>
                        {" "}
                        <span className={`${s.badge} ${s.badgeEmber}`} title={p.alertas.join(" · ")}>
                          ⚠ {p.alertas.length}
                        </span>
                      </>
                    )}
                  </td>
                  <td>
                    <span className={`${s.badge} ${p.etapa === "Ganado" ? s.badgeOk : ""}`}>{p.etapa}</span>
                  </td>
                  <td className={est === "vencido" ? s.vencido : est === "hoy" ? s.hoy : undefined}>{p.seguimiento ? fechaCorta(p.seguimiento) : <span className={s.sinDato}>—</span>}</td>
                  <td>{p.colonia || "—"}</td>
                  <td className={s.muted}>
                    {p.giro || "—"}
                    {p.categoria && p.categoria.toLowerCase() !== p.giro.toLowerCase() ? ` · ${p.categoria}` : ""}
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan={6} className={s.muted}>
                  {todos.length === 0 ? (
                    <>
                      Aún no hay prospectos. Importa con <code>npm run crm:importar</code>.
                    </>
                  ) : (
                    <>
                      No hay prospectos con esos filtros. <Link href="/admin">Quitar filtros</Link>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

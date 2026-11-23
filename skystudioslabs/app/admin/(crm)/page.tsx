import Link from "next/link";
import { requerirAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { ETAPAS } from "@/lib/types";
import { calcularMetricas, formatoMXN, formatoTasa } from "@/lib/crm/metricas";
import { seguimientosPendientes, estadoSeguimiento } from "@/lib/crm/reglas";
import { hoyMX, fechaCorta } from "@/lib/crm/fechas";
import { ORDENES, conteoPorEtapa, filtrarYOrdenar, leerFiltros, opcionesConConteo, type FiltrosLista, type Orden } from "@/lib/crm/lista";
import s from "../admin.module.css";

export const metadata = { title: "Prospectos" };

const ETIQUETA: Record<Orden, string> = { puntaje: "Puntaje", nombre: "Nombre", etapa: "Etapa", seguimiento: "Seguimiento", colonia: "Colonia" };

function url(f: FiltrosLista, cambios: Partial<Record<keyof FiltrosLista, string | null>>) {
  const p = new URLSearchParams();
  const v = {
    orden: f.orden,
    dir: f.dir,
    etapa: f.etapa,
    top10: f.top10 ? "1" : null,
    q: f.q || null,
    giro: f.giro || null,
    categoria: f.categoria || null,
    pendientes: f.pendientes ? "1" : null,
    ...cambios,
  };
  for (const [k, x] of Object.entries(v)) if (x) p.set(k, String(x));
  const qs = p.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

export default async function Prospectos({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requerirAdmin();
  const repo = await getRepo();
  const todos = await repo.listarProspectos();
  const hoy = hoyMX();
  const f = leerFiltros(await searchParams);
  const lista = filtrarYOrdenar(todos, f, hoy);
  const porEtapa = conteoPorEtapa(todos);
  const giros = opcionesConConteo(todos, (p) => p.giro);
  const categorias = opcionesConConteo(todos, (p) => p.categoria);
  const hayFiltros = Boolean(f.q || f.etapa || f.top10 || f.giro || f.categoria || f.pendientes);
  const m = calcularMetricas(todos, hoy);
  const pendientes = seguimientosPendientes(todos, hoy);

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

      <nav aria-label="Prospectos por etapa" className={s.fila} style={{ marginTop: 16 }}>
        {ETAPAS.map((e) => (
          <Link
            key={e}
            href={url(f, { etapa: f.etapa === e ? null : e })}
            className={`${s.badge} ${f.etapa === e ? s.badgeEmber : ""}`}
            aria-current={f.etapa === e ? "true" : undefined}
          >
            {e}: {porEtapa[e]}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="seg" className={`${s.card} ${pendientes.length ? s.cardEmber : ""}`} style={{ marginTop: 16 }}>
        <h2 id="seg" className={s.sub} style={{ marginTop: 0 }}>
          Seguimientos para hoy o vencidos: <span className={pendientes.length ? s.vencido : s.ok}>{pendientes.length}</span>
        </h2>
        {pendientes.length === 0 ? (
          <p className={s.muted}>Nada pendiente. ¡Bien!</p>
        ) : (
          <>
          <p style={{ marginBottom: 8 }}>
            <Link href={url(f, { pendientes: "1" })}>Ver solo estos en la lista</Link>
          </p>
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
          </>
        )}
      </section>

      <h2 className={s.sub}>Lista</h2>
      <form method="get" action="/admin" className={s.fila} role="search" style={{ marginBottom: 12 }}>
        <label className="sr-only" htmlFor="q">
          Buscar
        </label>
        <input id="q" name="q" defaultValue={f.q} placeholder="Buscar nombre, giro o colonia" className={s.input} style={{ maxWidth: 320 }} />
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
        <label className="sr-only" htmlFor="giro">
          Giro
        </label>
        <select id="giro" name="giro" defaultValue={f.giro} className={s.select} style={{ maxWidth: 220 }}>
          <option value="">Todos los giros</option>
          {giros.map((g) => (
            <option key={g.valor} value={g.valor}>
              {g.valor} ({g.n})
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="categoria">
          Categoría
        </label>
        <select id="categoria" name="categoria" defaultValue={f.categoria} className={s.select} style={{ maxWidth: 200 }}>
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.valor} ({c.n})
            </option>
          ))}
        </select>
        <label className={s.check}>
          <input type="checkbox" name="top10" value="1" defaultChecked={f.top10} /> Top 10
        </label>
        <label className={s.check}>
          <input type="checkbox" name="pendientes" value="1" defaultChecked={f.pendientes} /> Seguimiento hoy o vencido
        </label>
        <input type="hidden" name="orden" value={f.orden} />
        <input type="hidden" name="dir" value={f.dir} />
        <button type="submit" className={s.btn}>
          Filtrar
        </button>
        {hayFiltros && (
          <Link href="/admin" className={s.btn}>
            Limpiar
          </Link>
        )}
      </form>

      <p className={s.muted} style={{ marginBottom: 8 }}>
        {lista.length} de {todos.length}
      </p>
      <div className={s.tablaWrap}>
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
                  <td className={est === "vencido" ? s.vencido : est === "hoy" ? s.hoy : undefined}>{fechaCorta(p.seguimiento)}</td>
                  <td>{p.colonia || "—"}</td>
                  <td className={s.muted}>{p.giro || "—"}</td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan={6} className={s.muted}>
                  No hay prospectos con esos filtros. Importa con <code>npm run crm:importar</code>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

import Link from "next/link";
import { requerirAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { ETAPAS, NOMBRE_ACTIVIDAD } from "@/lib/types";
import { calcularMetricas, formatoMXN } from "@/lib/crm/metricas";
import { seguimientosPendientes } from "@/lib/crm/reglas";
import { agruparTareas } from "@/lib/crm/tareas";
import { fechaCorta, fechaHora, hoyMX } from "@/lib/crm/fechas";
import s from "../../admin.module.css";

export const metadata = { title: "Panel" };

/** Panel estilo Cartera: indicadores, embudo, próximas tareas, seguimientos y actividad reciente. */
export default async function Panel() {
  await requerirAdmin();
  const repo = await getRepo();
  const [prospectos, tareas, actividades] = await Promise.all([repo.listarProspectos(), repo.listarTareas(), repo.listarActividades(undefined, 8)]);
  const hoy = hoyMX();
  const m = calcularMetricas(prospectos, hoy);
  const g = agruparTareas(tareas, hoy);
  const pendientes = [...g.vencidas, ...g.hoy, ...g.proximas, ...g.sinFecha];
  const seguimientos = seguimientosPendientes(prospectos, hoy).slice(0, 6);
  const porEtapa = ETAPAS.map((e) => ({ e, n: prospectos.filter((p) => p.etapa === e).length }));
  const maximo = Math.max(1, ...porEtapa.map((x) => x.n));
  const nombre = new Map(prospectos.map((p) => [p.id, p.nombre]));
  const fechaLarga = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <>
      <div className={s.entre}>
        <div>
          <h1 className={s.titulo}>Panel</h1>
          <p className={s.muted} style={{ marginTop: -10 }}>{fechaLarga}</p>
        </div>
        <div className={s.fila}>
          <Link href="/admin/tareas" className={s.btn}>+ Tarea</Link>
          <Link href="/admin" className={`${s.btn} ${s.btnPrimario}`}>Ver prospectos</Link>
        </div>
      </div>

      <section aria-label="Indicadores" className={s.kpis}>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>Por contactar</div>
          <div className={s.kpiValor}>{porEtapa[0].n}</div>
          <div className={s.muted}>negocios en etapa Nuevo</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>En negociación</div>
          <div className={s.kpiValor}>{formatoMXN(m.enNegociacion)}</div>
          <div className={s.muted}>propuestas abiertas</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>Vendido este mes</div>
          <div className={`${s.kpiValor} ${s.ember}`}>{formatoMXN(m.vendidoMes)}</div>
          <div className={s.muted}>{m.ganados} ganados en total</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>Ingreso recurrente</div>
          <div className={s.kpiValor}>{formatoMXN(m.recurrenteMensual)}</div>
          <div className={s.muted}>mantenimientos al mes</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>Tareas</div>
          <div className={s.kpiValor}>{pendientes.length}</div>
          <div className={g.vencidas.length ? s.vencido : s.muted}>{g.vencidas.length} vencidas</div>
        </div>
      </section>

      <div className={s.grid2} style={{ marginTop: 16 }}>
        <section className={s.card} aria-labelledby="embudo">
          <div className={s.entre}>
            <h2 id="embudo" className={s.sub} style={{ margin: 0 }}>Embudo de captación</h2>
            <Link href="/admin/tablero">Ver tablero</Link>
          </div>
          <div className={s.barras}>
            {porEtapa.map(({ e, n }) => (
              <div key={e} className={s.barra}>
                <span>{e}</span>
                <span className={s.barraFondo}>
                  <i className={e === "Ganado" ? s.barraOk : undefined} style={{ width: `${(n / maximo) * 100}%` }} />
                </span>
                <span>{n}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={s.card} aria-labelledby="proximas">
          <div className={s.entre}>
            <h2 id="proximas" className={s.sub} style={{ margin: 0 }}>Próximas tareas</h2>
            <Link href="/admin/tareas">{g.vencidas.length ? <span className={s.vencido}>{g.vencidas.length} vencidas</span> : "Ver todas"}</Link>
          </div>
          <ul className={s.notas}>
            {pendientes.slice(0, 6).map((t) => (
              <li key={t.id} className={s.nota}>
                <div className={s.entre}>
                  <span>{t.titulo}</span>
                  <span className={t.vence && t.vence < hoy ? s.vencido : s.muted}>{t.vence ? (t.vence === hoy ? "Hoy" : fechaCorta(t.vence)) : "Sin fecha"}</span>
                </div>
                {t.prospecto_id && nombre.has(t.prospecto_id) && <Link href={`/admin/prospectos/${encodeURIComponent(t.prospecto_id)}`}>{nombre.get(t.prospecto_id)}</Link>}
              </li>
            ))}
            {pendientes.length === 0 && <li className={s.muted}>Sin tareas pendientes.</li>}
          </ul>
        </section>
      </div>

      <div className={s.grid2} style={{ marginTop: 16 }}>
        <section className={s.card} aria-labelledby="seg">
          <h2 id="seg" className={s.sub} style={{ marginTop: 0 }}>Seguimientos para hoy</h2>
          <ul className={s.notas}>
            {seguimientos.map((p) => (
              <li key={p.id} className={s.nota}>
                <div className={s.entre}>
                  <Link href={`/admin/prospectos/${encodeURIComponent(p.id)}`}>{p.nombre}</Link>
                  <span className={p.seguimiento && p.seguimiento < hoy ? s.vencido : s.hoy}>{fechaCorta(p.seguimiento)}</span>
                </div>
              </li>
            ))}
            {seguimientos.length === 0 && <li className={s.muted}>Nada pendiente hoy.</li>}
          </ul>
        </section>

        <section className={s.card} aria-labelledby="actividad">
          <h2 id="actividad" className={s.sub} style={{ marginTop: 0 }}>Actividad reciente</h2>
          <ul className={s.notas}>
            {actividades.map((a) => (
              <li key={a.id} className={s.nota}>
                <div className={s.notaFecha}>
                  <strong>{NOMBRE_ACTIVIDAD[a.tipo]}</strong> · {nombre.has(a.prospecto_id) ? <Link href={`/admin/prospectos/${encodeURIComponent(a.prospecto_id)}`}>{nombre.get(a.prospecto_id)}</Link> : "—"} · {fechaHora(a.fecha)}
                </div>
                <div className={s.pre}>{a.texto}</div>
              </li>
            ))}
            {actividades.length === 0 && <li className={s.muted}>Registra mensajes, llamadas y visitas desde la ficha de cada negocio.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}

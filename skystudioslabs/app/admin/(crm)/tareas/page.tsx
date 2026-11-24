import Link from "next/link";
import { requerirAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { PRIORIDADES, type Tarea } from "@/lib/types";
import { agruparTareas } from "@/lib/crm/tareas";
import { fechaCorta, hoyMX } from "@/lib/crm/fechas";
import { alternarTarea, borrarTareaAccion, crearTareaAccion } from "../cartera";
import s from "../../admin.module.css";

export const metadata = { title: "Tareas" };

export default async function Tareas({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requerirAdmin();
  const repo = await getRepo();
  const [tareas, prospectos] = await Promise.all([repo.listarTareas(), repo.listarProspectos()]);
  const hoy = hoyMX();
  const g = agruparTareas(tareas, hoy);
  const verHechas = (await searchParams).hechas === "1";
  const nombre = new Map(prospectos.map((p) => [p.id, p.nombre]));
  const opciones = [...prospectos].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const pendientes = g.vencidas.length + g.hoy.length + g.proximas.length + g.sinFecha.length;

  const fila = (t: Tarea) => (
    <li key={t.id} className={s.tarea}>
      <form action={alternarTarea}>
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="hecha" value={t.hecha ? "0" : "1"} />
        <button type="submit" className={s.btn} aria-label={t.hecha ? "Marcar como pendiente" : "Marcar como hecha"}>
          {t.hecha ? "↺" : "✓"}
        </button>
      </form>
      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
        <div style={t.hecha ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>{t.titulo}</div>
        {t.prospecto_id && nombre.has(t.prospecto_id) && <Link href={`/admin/prospectos/${encodeURIComponent(t.prospecto_id)}`}>{nombre.get(t.prospecto_id)}</Link>}
      </div>
      {t.prioridad !== "baja" && <span className={t.prioridad === "alta" ? `${s.badge} ${s.badgeEmber}` : s.badge}>{t.prioridad}</span>}
      <span className={!t.hecha && t.vence && t.vence < hoy ? s.vencido : s.muted}>{t.vence ? (t.vence === hoy ? "Hoy" : fechaCorta(t.vence)) : ""}</span>
      <form action={borrarTareaAccion}>
        <input type="hidden" name="id" value={t.id} />
        <button type="submit" className={s.linkBtn} aria-label={`Eliminar tarea ${t.titulo}`}>Eliminar</button>
      </form>
    </li>
  );
  const grupo = (titulo: string, lista: Tarea[], clase?: string) =>
    lista.length > 0 && (
      <section style={{ marginTop: 18 }} aria-label={titulo}>
        <h2 className={`${s.sub} ${clase ?? ""}`}>
          {titulo} <span className={s.muted}>{lista.length}</span>
        </h2>
        <ul className={s.tareas}>{lista.map(fila)}</ul>
      </section>
    );

  return (
    <>
      <h1 className={s.titulo}>
        Tareas <em>{pendientes}</em>
      </h1>
      <form action={crearTareaAccion} className={`${s.card} ${s.form}`}>
        <input name="titulo" required maxLength={300} className={s.input} placeholder="Ej.: Enviar propuesta a Taller Coronado" aria-label="Nueva tarea" />
        <div className={s.campos}>
          <input type="date" name="vence" defaultValue={hoy} className={s.input} aria-label="Fecha límite" />
          <select name="prioridad" defaultValue="media" className={s.input} aria-label="Prioridad">
            {PRIORIDADES.map((x) => (
              <option key={x} value={x}>Prioridad {x}</option>
            ))}
          </select>
          <select name="prospecto" defaultValue="" className={s.input} aria-label="Negocio">
            <option value="">— Sin negocio —</option>
            {opciones.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <button type="submit" className={`${s.btn} ${s.btnPrimario}`}>+ Nueva tarea</button>
        </div>
      </form>

      {tareas.length === 0 && <p className={s.muted} style={{ marginTop: 18 }}>Sin tareas. Crea recordatorios: llamar a un negocio, enviar una propuesta, publicar un video.</p>}
      {grupo("Vencidas", g.vencidas, s.vencido)}
      {grupo("Hoy", g.hoy)}
      {grupo("Próximas", g.proximas)}
      {grupo("Sin fecha", g.sinFecha)}
      {g.hechas.length > 0 && (
        <section style={{ marginTop: 18 }} aria-label="Completadas">
          <h2 className={s.sub}>
            Completadas <span className={s.muted}>{g.hechas.length}</span> <Link href={verHechas ? "/admin/tareas" : "/admin/tareas?hechas=1"}>{verHechas ? "Ocultar" : "Mostrar"}</Link>
          </h2>
          {verHechas && <ul className={s.tareas}>{g.hechas.slice(0, 30).map(fila)}</ul>}
        </section>
      )}
    </>
  );
}

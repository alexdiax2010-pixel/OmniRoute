import Link from "next/link";
import { requerirAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { CANALES } from "@/lib/types";
import { VARIABLES_PLANTILLA } from "@/lib/crm/plantillas";
import { borrarPlantillaAccion, guardarMiNombre, guardarPlantillaAccion } from "../cartera";
import s from "../../admin.module.css";

export const metadata = { title: "Mensajes" };
const CANAL = { whatsapp: "WhatsApp", email: "Email", instagram: "Instagram" } as const;

/** Plantillas de mensajes de captación (Cartera). Se rellenan solas en la ficha de cada prospecto. */
export default async function Mensajes({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requerirAdmin();
  const repo = await getRepo();
  const [plantillas, miNombre] = await Promise.all([repo.listarPlantillas(), repo.obtenerAjuste("mi_nombre")]);
  const editar = String((await searchParams).editar ?? "");
  const actual = plantillas.find((p) => p.id === editar);

  return (
    <>
      <h1 className={s.titulo}>Mensajes de captación</h1>
      <p className={s.muted} style={{ marginTop: -8 }}>Plantillas para escribir a negocios. Se rellenan solas desde la ficha de cada prospecto.</p>

      <form action={guardarMiNombre} className={`${s.card} ${s.fila}`} style={{ marginTop: 12 }}>
        <label className={s.campo} style={{ flex: "1 1 240px" }}>
          <span>Tu nombre o firma</span>
          <input name="nombre" defaultValue={miNombre ?? ""} maxLength={80} className={s.input} placeholder="Ej.: Alex · Sky Studios Labs" />
        </label>
        <button type="submit" className={s.btn}>Guardar</button>
        <p className={s.muted} style={{ flexBasis: "100%", margin: 0 }}>
          Variables: {VARIABLES_PLANTILLA.map((v) => `{${v}}`).join("  ")}
        </p>
      </form>

      <form action={guardarPlantillaAccion} className={`${s.card} ${s.form}`} style={{ marginTop: 16 }} key={actual?.id ?? "nueva"}>
        <h2 className={s.sub} style={{ marginTop: 0 }}>{actual ? "Editar plantilla" : "Nueva plantilla"}</h2>
        {actual && <input type="hidden" name="id" value={actual.id} />}
        <div className={s.campos}>
          <label className={s.campo}>
            <span>Nombre</span>
            <input name="titulo" required maxLength={120} defaultValue={actual?.titulo ?? ""} className={s.input} placeholder="Ej.: Primer contacto" />
          </label>
          <label className={s.campo}>
            <span>Canal</span>
            <select name="canal" defaultValue={actual?.canal ?? "whatsapp"} className={s.input}>
              {CANALES.map((c) => (
                <option key={c} value={c}>{CANAL[c]}</option>
              ))}
            </select>
          </label>
        </div>
        <label className={s.campo}>
          <span>Mensaje</span>
          <textarea name="cuerpo" required maxLength={4000} rows={7} defaultValue={actual?.cuerpo ?? ""} className={s.textarea} />
        </label>
        <div className={s.fila}>
          <button type="submit" className={`${s.btn} ${s.btnPrimario}`}>Guardar</button>
          {actual && <Link href="/admin/mensajes" className={s.btn}>Cancelar</Link>}
        </div>
      </form>

      <div className={s.plantillas} style={{ marginTop: 16 }}>
        {plantillas.map((p) => (
          <article key={p.id} className={s.card}>
            <div className={s.entre}>
              <h3 className={s.sub} style={{ margin: 0 }}>{p.titulo}</h3>
              <span className={s.badge}>{CANAL[p.canal]}</span>
            </div>
            <p className={`${s.pre} ${s.muted}`}>{p.cuerpo}</p>
            <div className={s.fila}>
              <Link href={`/admin/mensajes?editar=${p.id}`} className={s.btn}>Editar</Link>
              <form action={borrarPlantillaAccion}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className={s.linkBtn}>Eliminar</button>
              </form>
            </div>
          </article>
        ))}
        {plantillas.length === 0 && <p className={s.muted}>Sin plantillas. Escribe tu mensaje de primer contacto una vez y reutilízalo con cada negocio.</p>}
      </div>
    </>
  );
}

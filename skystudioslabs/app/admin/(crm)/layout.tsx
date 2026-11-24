import Link from "next/link";
import { requerirAdmin } from "@/lib/auth";
import { pushConfigurado } from "@/lib/push";
import { getRepo } from "@/lib/data";
import { contarVencidas } from "@/lib/crm/tareas";
import { hoyMX } from "@/lib/crm/fechas";
import { AvisosTelefono } from "./_componentes/AvisosTelefono";
import { NavCrm } from "./_componentes/NavCrm";
import s from "../admin.module.css";

/** Todo lo que está bajo (crm) exige admin. Las Server Actions vuelven a verificarlo. */
export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const sesion = await requerirAdmin();
  let vencidas = 0;
  try {
    vencidas = contarVencidas(await (await getRepo()).listarTareas(), hoyMX());
  } catch {
    // Si la tabla de tareas aún no existe (migración pendiente), el CRM sigue funcionando.
  }
  return (
    <div className={s.app}>
      <aside className={s.top}>
        <Link href="/admin/panel" className={s.marca}>
          <span className={s.marcaIcono} aria-hidden="true">S</span> Sky <span>CRM</span>
        </Link>
        <NavCrm vencidas={vencidas} />
        <form action="/auth/salir" method="post" className={s.salir}>
          <button type="submit" className={s.linkBtn} title={sesion.email}>
            Salir
          </button>
        </form>
      </aside>
      <main className={s.main} id="contenido">
        {pushConfigurado() && <AvisosTelefono llavePublica={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim()} />}
        {children}
      </main>
    </div>
  );
}

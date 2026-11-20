import Link from "next/link";
import { requerirAdmin } from "@/lib/auth";
import s from "../admin.module.css";

/** Todo lo que está bajo (crm) exige admin. Las Server Actions vuelven a verificarlo. */
export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const sesion = await requerirAdmin();
  return (
    <>
      <header className={s.top}>
        <div className={s.topIn}>
          <Link href="/admin" className={s.marca}>
            Sky <span>CRM</span>
          </Link>
          <nav className={s.nav} aria-label="CRM">
            <Link href="/admin">Prospectos</Link>
            <Link href="/admin/tablero">Tablero</Link>
            <Link href="/admin/clientes">Clientes</Link>
            <a href="/admin/exportar.csv">Exportar CSV</a>
            <form action="/auth/salir" method="post">
              <button type="submit" className={s.linkBtn} title={sesion.email}>
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className={s.main} id="contenido">
        {children}
      </main>
    </>
  );
}

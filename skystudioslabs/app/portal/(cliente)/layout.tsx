import { requerirCliente } from "@/lib/auth";
import s from "../portal.module.css";

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  await requerirCliente();
  return (
    <>
      <header className={s.top}>
        <div className={s.topIn}>
          <span className={s.marca}>
            Sky <span>Studios</span>
          </span>
          <form action="/auth/salir" method="post">
            <input type="hidden" name="a" value="portal" />
            <button type="submit" className={s.salir}>
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className={s.main} id="contenido">
        {children}
      </main>
    </>
  );
}

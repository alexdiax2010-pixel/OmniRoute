"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import s from "../../admin.module.css";

const ENLACES: { href: string; texto: string; corto?: string }[] = [
  { href: "/admin/panel", texto: "Panel" },
  { href: "/admin", texto: "Prospectos", corto: "Negocios" },
  { href: "/admin/tablero", texto: "Tablero" },
  { href: "/admin/tareas", texto: "Tareas" },
  { href: "/admin/mensajes", texto: "Mensajes" },
  { href: "/admin/clientes", texto: "Clientes" },
];

/** Íconos de trazo simple para la barra inferior del teléfono. */
const ICONO: Record<string, React.ReactNode> = {
  "/admin/panel": <path d="M4 13h6V4H4zM14 20h6V11h-6zM4 20h6v-3H4zM14 7h6V4h-6z" />,
  "/admin": <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 19v-1a4 4 0 0 0-3-3.8M15.5 3.2a3.5 3.5 0 0 1 0 6.6" />,
  "/admin/tablero": <path d="M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v7h-4z" />,
  "/admin/tareas": <path d="M9 11l3 3 8-8M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11" />,
  mas: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3.2" />,
};

function Icono({ d }: { d: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

/** Navegación del CRM (estilo Cartera): lateral en computadora y barra inferior en el teléfono. */
export function NavCrm({ vencidas }: { vencidas: number }) {
  const ruta = usePathname();
  const mas = useRef<HTMLDetailsElement>(null);
  const activa = (href: string) => (href === "/admin" ? ruta === "/admin" || ruta.startsWith("/admin/prospectos") : ruta.startsWith(href));
  const cerrar = () => mas.current?.removeAttribute("open");
  const principales = ENLACES.slice(0, 4);
  const resto = ENLACES.slice(4);
  const enResto = resto.some((e) => activa(e.href));

  return (
    <>
      <nav className={s.nav} aria-label="CRM">
        {ENLACES.map((e) => (
          <Link key={e.href} href={e.href} aria-current={activa(e.href) ? "page" : undefined}>
            {e.texto}
            {e.href === "/admin/tareas" && vencidas > 0 && <span className={s.contador}>{vencidas}</span>}
          </Link>
        ))}
        <a href="/admin/exportar.csv">Exportar CSV</a>
      </nav>

      <nav className={s.barraMovil} aria-label="CRM en el teléfono">
        {principales.map((e) => (
          <Link key={e.href} href={e.href} aria-current={activa(e.href) ? "page" : undefined} onClick={cerrar}>
            <span className={s.barraIcono}>
              <Icono d={ICONO[e.href]} />
              {e.href === "/admin/tareas" && vencidas > 0 && <span className={s.puntoAlerta}>{vencidas}</span>}
            </span>
            {e.corto ?? e.texto}
          </Link>
        ))}
        <details ref={mas} className={s.mas}>
          <summary aria-current={enResto ? "page" : undefined}>
            <span className={s.barraIcono}>
              <Icono d={ICONO.mas} />
            </span>
            Más
          </summary>
          <div className={s.masMenu}>
            {resto.map((e) => (
              <Link key={e.href} href={e.href} aria-current={activa(e.href) ? "page" : undefined} onClick={cerrar}>
                {e.texto}
              </Link>
            ))}
            <a href="/admin/exportar.csv" onClick={cerrar}>
              Exportar CSV
            </a>
          </div>
        </details>
      </nav>
    </>
  );
}

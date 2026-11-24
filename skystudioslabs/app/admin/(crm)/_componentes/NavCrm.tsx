"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "../../admin.module.css";

const ENLACES = [
  { href: "/admin/panel", texto: "Panel" },
  { href: "/admin", texto: "Prospectos" },
  { href: "/admin/tablero", texto: "Tablero" },
  { href: "/admin/tareas", texto: "Tareas" },
  { href: "/admin/mensajes", texto: "Mensajes" },
  { href: "/admin/clientes", texto: "Clientes" },
];

/** Navegación lateral del CRM (estilo Cartera). Marca la sección actual con aria-current. */
export function NavCrm({ vencidas }: { vencidas: number }) {
  const ruta = usePathname();
  const activa = (href: string) => (href === "/admin" ? ruta === "/admin" || ruta.startsWith("/admin/prospectos") : ruta.startsWith(href));
  return (
    <nav className={s.nav} aria-label="CRM">
      {ENLACES.map((e) => (
        <Link key={e.href} href={e.href} aria-current={activa(e.href) ? "page" : undefined}>
          {e.texto}
          {e.href === "/admin/tareas" && vencidas > 0 && <span className={s.contador}>{vencidas}</span>}
        </Link>
      ))}
      <a href="/admin/exportar.csv">Exportar CSV</a>
    </nav>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Home from "../../page";
import { TEMAS, obtenerTema, cssTema } from "@/lib/temas";
import s from "./prototipo.module.css";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return TEMAS.map((t) => ({ tema: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tema: string }> }): Promise<Metadata> {
  const t = obtenerTema((await params).tema);
  return {
    title: `Prototipo de paleta: ${t?.nombre ?? ""}`,
    robots: { index: false, follow: false },
  };
}

export default async function PrototipoPaleta({ params }: { params: Promise<{ tema: string }> }) {
  const tema = obtenerTema((await params).tema);
  if (!tema) notFound();
  return (
    <>
      <style href={`tema-${tema.slug}`} precedence="high">
        {cssTema(tema)}
      </style>
      <nav className={s.franja} aria-label="Prototipos de paleta">
        <span className={s.etiqueta}>
          Prototipo de paleta: <strong>{tema.nombre}</strong>
          <span className={s.muestras} aria-hidden="true">
            {tema.muestras.map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </span>
        </span>
        <span className={s.enlaces}>
          <Link href="/">Original</Link>
          {TEMAS.map((t) => (
            <Link key={t.slug} href={`/prototipo/${t.slug}`} aria-current={t.slug === tema.slug ? "page" : undefined}>
              {t.nombre}
            </Link>
          ))}
        </span>
      </nav>
      <Home />
    </>
  );
}

import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { enviarEnlacePortal } from "@/app/auth/acciones";
import { obtenerSesion } from "@/lib/auth";
import s from "../portal.module.css";

export const metadata = { title: "Entrar" };

export default async function LoginPortal({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sesion = await obtenerSesion();
  if (sesion?.rol === "cliente") redirect("/portal");
  const { error } = await searchParams;
  return (
    <main className={s.login}>
      <h1 className={s.titulo}>
        Mi <em>portal</em>
      </h1>
      <p className={s.muted}>Escribe el correo con el que te registramos y te mandamos un enlace para entrar.</p>
      {error === "enlace" && (
        <p className={s.error} role="alert">
          El enlace no es válido o ya venció. Pide uno nuevo.
        </p>
      )}
      <LoginForm accion={enviarEnlacePortal} />
    </main>
  );
}

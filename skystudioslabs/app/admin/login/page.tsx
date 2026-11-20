import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { enviarEnlaceAdmin } from "@/app/auth/acciones";
import { obtenerSesion } from "@/lib/auth";
import s from "../admin.module.css";

export const metadata = { title: "Entrar" };

export default async function LoginAdmin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sesion = await obtenerSesion();
  if (sesion?.rol === "admin") redirect("/admin");
  const { error } = await searchParams;
  return (
    <main className={s.login}>
      <h1 className={s.titulo}>
        CRM <em>Sky</em>
      </h1>
      <p className={s.muted} style={{ marginBottom: 16 }}>
        Te enviamos un enlace de acceso a tu correo. Sin contraseñas.
      </p>
      {error === "enlace" && (
        <p className={s.error} role="alert" style={{ marginBottom: 12 }}>
          El enlace no es válido o ya venció. Pide uno nuevo.
        </p>
      )}
      <LoginForm accion={enviarEnlaceAdmin} />
    </main>
  );
}

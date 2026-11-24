"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { codigoAdminConfigurado, codigoCorrecto, crearSesionCodigo } from "@/lib/auth-codigo";
import { z } from "zod";
import { MENSAJE_ENLACE, secreto, solicitarEnlace } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { hashIp, ipDeCabeceras } from "@/lib/lead";

export type EstadoLogin = { mensaje: string; error?: boolean; enlaceLocal?: string } | null;

const esquema = z.object({ email: z.email("Escribe un correo válido").max(200) });
const LIMITE_LOGIN_HORA = 10;

async function enviar(formData: FormData, contexto: "admin" | "portal"): Promise<EstadoLogin> {
  const r = esquema.safeParse({ email: String(formData.get("email") ?? "").trim() });
  if (!r.success) return { mensaje: "Escribe un correo válido.", error: true };
  try {
    const repo = await getRepo();
    const ip = ipDeCabeceras(await headers());
    const n = await repo.registrarEnvio(hashIp(`login:${ip}`, secreto()), new Date(Date.now() - 3600_000).toISOString());
    if (n > LIMITE_LOGIN_HORA) return { mensaje: "Demasiados intentos. Espera un rato e inténtalo de nuevo.", error: true };
    return await solicitarEnlace(r.data.email, contexto);
  } catch (e) {
    console.error("[auth] enviar enlace falló", e instanceof Error ? e.message : "");
    return { mensaje: MENSAJE_ENLACE };
  }
}

export async function enviarEnlaceAdmin(_prev: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  return enviar(formData, "admin");
}

export async function enviarEnlacePortal(_prev: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  return enviar(formData, "portal");
}

const LIMITE_CODIGO_HORA = 5;
/** Tope GLOBAL de códigos fallidos por hora (todas las IPs): frena un ataque repartido entre muchas IPs. */
const LIMITE_FALLOS_CODIGO_GLOBAL_HORA = 30;
const CLAVE_FALLOS_GLOBAL = "codigo:fallos-global";
const esquemaCodigo = z.object({ codigo: z.string().min(1).max(128) });

/** Entrar al CRM con el código especial (ADMIN_CODIGO). 5 intentos por hora por IP y 30 fallos/hora en total. */
export async function entrarConCodigo(_prev: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const r = esquemaCodigo.safeParse({ codigo: String(formData.get("codigo") ?? "") });
  if (!r.success) return { mensaje: "Escribe el código.", error: true };
  if (!codigoAdminConfigurado()) return { mensaje: "El acceso con código no está activado.", error: true };
  let ok = false;
  try {
    const repo = await getRepo();
    const ip = ipDeCabeceras(await headers());
    const haceUnaHora = new Date(Date.now() - 3600_000).toISOString();
    const claveGlobal = hashIp(CLAVE_FALLOS_GLOBAL, secreto());
    if ((await repo.contarEnvios(claveGlobal, haceUnaHora)) >= LIMITE_FALLOS_CODIGO_GLOBAL_HORA)
      return { mensaje: "El acceso con código está pausado por muchos intentos fallidos. Espera una hora o entra con el enlace a tu correo.", error: true };
    const n = await repo.registrarEnvio(hashIp(`codigo:${ip}`, secreto()), haceUnaHora);
    if (n > LIMITE_CODIGO_HORA) return { mensaje: "Demasiados intentos. Espera una hora e inténtalo de nuevo.", error: true };
    ok = codigoCorrecto(r.data.codigo);
    if (ok) await crearSesionCodigo();
    else await repo.registrarEnvio(claveGlobal, haceUnaHora);
  } catch (e) {
    console.error("[auth] entrar con código falló", e instanceof Error ? e.message : "");
    return { mensaje: "No se pudo entrar. Inténtalo de nuevo.", error: true };
  }
  if (!ok) return { mensaje: "Código incorrecto.", error: true };
  redirect("/admin");
}

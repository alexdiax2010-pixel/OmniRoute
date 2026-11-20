"use server";

import { headers } from "next/headers";
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

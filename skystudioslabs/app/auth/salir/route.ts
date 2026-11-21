import type { NextRequest } from "next/server";
import { cerrarSesion } from "@/lib/auth";
import { redireccionRelativa } from "@/lib/redireccion";

/** Cerrar sesión (POST para evitar logout por enlaces/prefetch). */
export async function POST(request: NextRequest) {
  await cerrarSesion();
  const form = await request.formData().catch(() => null);
  const portal = form?.get("a") === "portal";
  return redireccionRelativa(portal ? "/portal/login" : "/admin/login", 303);
}

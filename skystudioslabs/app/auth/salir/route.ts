import { NextResponse, type NextRequest } from "next/server";
import { cerrarSesion } from "@/lib/auth";

/** Cerrar sesión (POST para evitar logout por enlaces/prefetch). */
export async function POST(request: NextRequest) {
  await cerrarSesion();
  const form = await request.formData().catch(() => null);
  const portal = form?.get("a") === "portal";
  return NextResponse.redirect(new URL(portal ? "/portal/login" : "/admin/login", request.nextUrl), 303);
}

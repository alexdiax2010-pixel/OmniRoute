import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Repo, NuevoProspecto } from "./repo";
import type { Prospecto, Sitio, SolicitudCambio, Nota, Etapa, SuscripcionPush, Actividad, Tarea, Plantilla } from "@/lib/types";
import type { Servicio } from "@/config/precios";
import { prospectoBase } from "./base";
import { clienteServicio, clienteSesionOServicio } from "@/lib/supabase/servidor";
import { adminPorCodigo } from "@/lib/auth-codigo";

/**
 * Repo sobre Supabase.
 *
 * Qué cliente usa cada método:
 *  [SESIÓN → RLS]  (en scripts sin petición HTTP cae a service role)
 *    (los prospectos se leen de la vista prospectos_completo y se escriben repartidos entre
 *     prospectos [parte de cliente] y prospectos_internos [solo admins])
 *    listarProspectos, obtenerProspecto, upsertProspectos, actualizarProspecto, agregarNota,
 *    listarSitios, guardarSitio, crearSolicitudCambio, listarSolicitudes
 *  [SERVICE ROLE]  (solo servidor; el llamador ya validó con Zod / sesión)
 *    crearProspecto (formulario público), registrarEnvio / contarEnvios (antispam), contarSitiosActivos (rpc),
 *    obtenerSitio / obtenerSitioPorDominio (servir páginas públicas de clientes),
 *    prospectoIdPorEmail (login/invitación), volcarTodo (respaldo)
 */

type Fila = Record<string, unknown>;

const num = (v: unknown): number | null => (v == null || v === "" ? null : Number(v));
const fecha = (v: unknown): string | null => (v == null ? null : String(v).slice(0, 10));

export function deFila(r: Fila): Prospecto {
  return {
    id: String(r.id),
    nombre: String(r.nombre ?? ""),
    giro: String(r.giro ?? ""),
    categoria: String(r.categoria ?? ""),
    colonia: String(r.colonia ?? ""),
    direccion: String(r.direccion ?? ""),
    telefono: String(r.telefono ?? ""),
    whatsapp: String(r.whatsapp ?? ""),
    puntaje: num(r.puntaje) ?? 0,
    razon: String(r.razon ?? ""),
    alertas: (r.alertas as string[] | null) ?? [],
    top10: Boolean(r.top10),
    etapa: (r.etapa as Etapa) ?? "Nuevo",
    seguimiento: fecha(r.seguimiento),
    mensaje: String(r.mensaje ?? ""),
    guion: String(r.guion ?? ""),
    notas: (r.notas as Nota[] | null) ?? [],
    boceto: String(r.boceto ?? ""),
    fuente: String(r.fuente ?? ""),
    sesion: String(r.sesion ?? ""),
    paquete: (r.paquete as string | null) ?? null,
    monto: num(r.monto),
    mensualidad: num(r.mensualidad),
    diaCobro: num(r.dia_cobro),
    servicios: ((r.servicios as string[] | null) ?? []) as Servicio[],
    fechaGanado: fecha(r.fecha_ganado),
    email: (r.email as string | null) ?? null,
    creado: String(r.creado ?? ""),
    actualizado: String(r.actualizado ?? ""),
  };
}

const MAPA: Partial<Record<keyof Prospecto, string>> = { diaCobro: "dia_cobro", fechaGanado: "fecha_ganado" };

/**
 * Columnas que viven en public.prospectos_internos (solo admins). El resto va en public.prospectos,
 * que es lo único que un cliente del portal puede leer de su propia fila.
 */
export const COLUMNAS_INTERNAS = [
  "telefono", "whatsapp", "puntaje", "razon", "alertas", "top10", "etapa", "seguimiento",
  "mensaje", "guion", "notas", "boceto", "fuente", "sesion",
] as const;
const INTERNAS = new Set<string>(COLUMNAS_INTERNAS);

/** Separa una fila en la parte de cliente y la parte interna. */
export function dividirFila(f: Fila): { publica: Fila; interna: Fila } {
  const publica: Fila = {};
  const interna: Fila = {};
  for (const [k, v] of Object.entries(f)) (INTERNAS.has(k) ? interna : publica)[k] = v;
  return { publica, interna };
}

/** Vista de lectura (une ambas tablas con el RLS de quien consulta). */
const VISTA = "prospectos_completo";

/** camelCase → columnas. Solo incluye las claves presentes (para updates parciales). */
export function aFila(p: Partial<Prospecto>): Fila {
  const f: Fila = {};
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || k === "actualizado") continue; // actualizado lo pone el trigger
    f[MAPA[k as keyof Prospecto] ?? k] = k === "email" && typeof v === "string" ? v.toLowerCase() : v;
  }
  return f;
}

function deSitio(r: Fila): Sitio {
  return {
    slug: String(r.slug),
    tipo: r.tipo as Sitio["tipo"],
    prospecto_id: (r.prospecto_id as string | null) ?? null,
    carpeta: String(r.carpeta ?? ""),
    dominio_propio: (r.dominio_propio as string | null) ?? null,
    activo: Boolean(r.activo),
    expira: fecha(r.expira),
    creado: String(r.creado ?? ""),
  };
}

/** Nunca propagamos el mensaje crudo de la base de datos a la UI. */
function fallo(op: string, error: { message?: string; code?: string } | null): never {
  console.error(`[supabase] ${op} falló`, error?.code ?? "", error?.message ?? "");
  throw new Error(`No se pudo completar la operación (${op}).`);
}

async function rls(): Promise<SupabaseClient> {
  // Sesión de admin iniciada con código especial: no hay sesión de Supabase, se usa la service
  // role. adminPorCodigo() verifica la cookie firmada; las acciones del CRM además llaman requerirAdmin().
  if (await adminPorCodigo()) return clienteServicio();
  return clienteSesionOServicio();
}

export function supabaseRepo(): Repo {
  return {
    async listarProspectos() {
      const db = await rls();
      const { data, error } = await db.from(VISTA).select("*").order("puntaje", { ascending: false }).limit(5000);
      if (error) fallo("listarProspectos", error);
      return (data ?? []).map(deFila);
    },
    async obtenerProspecto(id) {
      const db = await rls();
      const { data, error } = await db.from(VISTA).select("*").eq("id", id).maybeSingle();
      if (error) fallo("obtenerProspecto", error);
      return data ? deFila(data) : null;
    },
    async upsertProspectos(lista) {
      if (!lista.length) return { insertados: 0, actualizados: 0 };
      const db = await rls();
      const ids = lista.map((p) => p.id);
      const existentes = new Set<string>();
      for (let i = 0; i < ids.length; i += 500) {
        const { data, error } = await db.from("prospectos").select("id").in("id", ids.slice(i, i + 500));
        if (error) fallo("upsertProspectos", error);
        for (const r of data ?? []) existentes.add(String(r.id));
      }
      for (let i = 0; i < lista.length; i += 500) {
        const partes = lista.slice(i, i + 500).map((p) => ({ id: p.id, ...dividirFila(aFila(p)) }));
        // Primero la parte de cliente (la interna referencia su id).
        const pub = await db.from("prospectos").upsert(partes.map((x) => x.publica), { onConflict: "id" });
        if (pub.error) fallo("upsertProspectos", pub.error);
        const int = await db.from("prospectos_internos").upsert(partes.map((x) => ({ ...x.interna, id: x.id })), { onConflict: "id" });
        if (int.error) fallo("upsertProspectos", int.error);
      }
      const actualizados = ids.filter((id) => existentes.has(id)).length;
      return { insertados: ids.length - actualizados, actualizados };
    },
    async crearProspecto(p: NuevoProspecto) {
      // SERVICE ROLE: lo usa el formulario público (ya validado con Zod + honeypot + rate limit).
      const db = clienteServicio();
      const { publica, interna } = dividirFila(aFila(prospectoBase(p)));
      const pub = await db.from("prospectos").insert(publica);
      if (pub.error) fallo("crearProspecto", pub.error);
      const int = await db.from("prospectos_internos").insert({ ...interna, id: publica.id });
      if (int.error) {
        await db.from("prospectos").delete().eq("id", String(publica.id));
        fallo("crearProspecto", int.error);
      }
      const { data, error } = await db.from(VISTA).select("*").eq("id", String(publica.id)).single();
      if (error) fallo("crearProspecto", error);
      return deFila(data);
    },
    async actualizarProspecto(id, cambios) {
      const db = await rls();
      const { id: _ignorado, creado: _c, ...resto } = cambios;
      void _ignorado;
      void _c;
      const { publica, interna } = dividirFila(aFila(resto));
      if (Object.keys(publica).length) {
        const r = await db.from("prospectos").update(publica).eq("id", id);
        if (r.error) fallo("actualizarProspecto", r.error);
      }
      if (Object.keys(interna).length) {
        // upsert: un prospecto viejo sin fila interna la obtiene aquí.
        const r = await db.from("prospectos_internos").upsert({ ...interna, id }, { onConflict: "id" });
        if (r.error) fallo("actualizarProspecto", r.error);
      }
      const { data, error } = await db.from(VISTA).select("*").eq("id", id).maybeSingle();
      if (error) fallo("actualizarProspecto", error);
      if (!data) throw new Error("Prospecto no encontrado");
      return deFila(data);
    },
    async agregarNota(id, nota) {
      const db = await rls();
      const { error } = await db.rpc("agregar_nota", { p_id: id, p_nota: nota });
      if (error) fallo("agregarNota", error);
    },
    async listarSitios() {
      const db = await rls();
      const { data, error } = await db.from("sitios").select("*").order("creado", { ascending: false });
      if (error) fallo("listarSitios", error);
      return (data ?? []).map(deSitio);
    },
    async obtenerSitio(slug) {
      const { data, error } = await clienteServicio().from("sitios").select("*").eq("slug", slug).maybeSingle();
      if (error) fallo("obtenerSitio", error);
      return data ? deSitio(data) : null;
    },
    async obtenerSitioPorDominio(host) {
      const { data, error } = await clienteServicio().from("sitios").select("*").eq("dominio_propio", host.toLowerCase()).maybeSingle();
      if (error) fallo("obtenerSitioPorDominio", error);
      return data ? deSitio(data) : null;
    },
    async guardarSitio(s) {
      const db = await rls();
      const fila: Fila = { ...s };
      if (!s.creado) delete fila.creado;
      const { data, error } = await db.from("sitios").upsert(fila, { onConflict: "slug" }).select("*").single();
      if (error) fallo("guardarSitio", error);
      return deSitio(data);
    },
    async listarSitiosPublicos() {
      // SERVICE ROLE: el sitemap es público y no tiene sesión; solo sitios de clientes activos.
      const { data, error } = await clienteServicio()
        .from("sitios")
        .select("*")
        .eq("tipo", "cliente")
        .eq("activo", true)
        .order("creado", { ascending: false });
      if (error) fallo("listarSitiosPublicos", error);
      return (data ?? []).map(deSitio);
    },
    async contarSitiosActivos() {
      const { data, error } = await clienteServicio().rpc("contar_sitios_activos");
      if (error) fallo("contarSitiosActivos", error);
      return Number(data ?? 0);
    },
    async prospectoIdPorEmail(email) {
      const e = email.trim().toLowerCase();
      const { data, error } = await clienteServicio().from("prospectos").select("id").eq("email", e).limit(1).maybeSingle();
      if (error) fallo("prospectoIdPorEmail", error);
      return data ? String(data.id) : null;
    },
    async crearSolicitudCambio(s) {
      // RLS: el cliente solo puede insertar para SU prospecto. El trigger agrega la nota "[Portal]".
      const db = await rls();
      const { data, error } = await db.from("solicitudes_cambio").insert(s).select("*").single();
      if (error) fallo("crearSolicitudCambio", error);
      return data as SolicitudCambio;
    },
    async listarSolicitudes(prospectoId) {
      // RLS: el cliente solo ve las suyas; además filtramos por el id de la sesión.
      const db = await rls();
      const { data, error } = await db
        .from("solicitudes_cambio")
        .select("id, prospecto_id, texto, foto, creado")
        .eq("prospecto_id", prospectoId)
        .order("creado", { ascending: false })
        .limit(50);
      if (error) fallo("listarSolicitudes", error);
      return (data ?? []) as SolicitudCambio[];
    },
    async contarEnvios(ipHash, desde) {
      const { count, error } = await clienteServicio().from("envios").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("t", desde);
      if (error) fallo("contarEnvios", error);
      return count ?? 0;
    },
    async registrarEnvio(ipHash, desde) {
      const db = clienteServicio();
      // Limpieza de envíos viejos (más de un día) para que la tabla no crezca.
      const ayer = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      await db.from("envios").delete().lt("t", ayer < desde ? ayer : desde);
      const ins = await db.from("envios").insert({ ip_hash: ipHash });
      if (ins.error) fallo("registrarEnvio", ins.error);
      const { count, error } = await db.from("envios").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("t", desde);
      if (error) fallo("registrarEnvio", error);
      return count ?? 1;
    },
    async guardarSuscripcionPush(s) {
      const { error } = await clienteServicio().from("push_suscripciones").upsert(s, { onConflict: "endpoint" });
      if (error) fallo("guardarSuscripcionPush", error);
    },
    async listarSuscripcionesPush() {
      const { data, error } = await clienteServicio().from("push_suscripciones").select("endpoint, p256dh, auth, etiqueta");
      if (error) fallo("listarSuscripcionesPush", error);
      return (data ?? []) as SuscripcionPush[];
    },
    async borrarSuscripcionPush(endpoint) {
      const { error } = await clienteServicio().from("push_suscripciones").delete().eq("endpoint", endpoint);
      if (error) fallo("borrarSuscripcionPush", error);
    },
    async listarActividades(prospectoId, limite) {
      let q = (await rls()).from("actividades").select("id, prospecto_id, tipo, texto, fecha, creado").order("fecha", { ascending: false });
      if (prospectoId) q = q.eq("prospecto_id", prospectoId);
      if (limite) q = q.limit(limite);
      const { data, error } = await q;
      if (error) fallo("listarActividades", error);
      return (data ?? []) as Actividad[];
    },
    async crearActividad(a) {
      const { data, error } = await (await rls()).from("actividades").insert(a).select("id, prospecto_id, tipo, texto, fecha, creado").single();
      if (error) fallo("crearActividad", error);
      return data as Actividad;
    },
    async listarTareas() {
      const { data, error } = await (await rls()).from("tareas").select("*").order("vence", { ascending: true, nullsFirst: false });
      if (error) fallo("listarTareas", error);
      return (data ?? []).map((t) => ({ ...t, vence: fecha(t.vence) })) as Tarea[];
    },
    async crearTarea(t) {
      const { data, error } = await (await rls()).from("tareas").insert(t).select("*").single();
      if (error) fallo("crearTarea", error);
      return { ...data, vence: fecha(data.vence) } as Tarea;
    },
    async actualizarTarea(id, cambios) {
      const { error } = await (await rls()).from("tareas").update(cambios).eq("id", id);
      if (error) fallo("actualizarTarea", error);
    },
    async borrarTarea(id) {
      const { error } = await (await rls()).from("tareas").delete().eq("id", id);
      if (error) fallo("borrarTarea", error);
    },
    async listarPlantillas() {
      const { data, error } = await (await rls()).from("plantillas").select("*").order("titulo");
      if (error) fallo("listarPlantillas", error);
      return (data ?? []) as Plantilla[];
    },
    async guardarPlantilla(p) {
      const db = await rls();
      const fila = { titulo: p.titulo, canal: p.canal, cuerpo: p.cuerpo };
      const { data, error } = p.id
        ? await db.from("plantillas").update(fila).eq("id", p.id).select("*").single()
        : await db.from("plantillas").insert(fila).select("*").single();
      if (error) fallo("guardarPlantilla", error);
      return data as Plantilla;
    },
    async borrarPlantilla(id) {
      const { error } = await (await rls()).from("plantillas").delete().eq("id", id);
      if (error) fallo("borrarPlantilla", error);
    },
    async obtenerAjuste(clave) {
      const { data, error } = await (await rls()).from("ajustes_crm").select("valor").eq("clave", clave).maybeSingle();
      if (error) fallo("obtenerAjuste", error);
      return (data?.valor as string | undefined) ?? null;
    },
    async guardarAjuste(clave, valor) {
      const { error } = await (await rls()).from("ajustes_crm").upsert({ clave, valor }, { onConflict: "clave" });
      if (error) fallo("guardarAjuste", error);
    },
    async volcarTodo() {
      const db = clienteServicio();
      const out: Record<string, unknown[]> = {};
      for (const tabla of ["prospectos", "prospectos_internos", "sitios", "solicitudes_cambio", "clientes_portal", "admins", "actividades", "tareas", "plantillas", "ajustes_crm"]) {
        const filas: unknown[] = [];
        for (let desde = 0; ; desde += 1000) {
          const { data, error } = await db.from(tabla).select("*").range(desde, desde + 999);
          if (error) fallo(`volcarTodo:${tabla}`, error);
          filas.push(...(data ?? []));
          if (!data || data.length < 1000) break;
        }
        out[tabla] = filas;
      }
      return out;
    },
  };
}

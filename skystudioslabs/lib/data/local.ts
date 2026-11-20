import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Repo } from "./repo";
import { prospectoBase } from "./base";
import type { Prospecto, Sitio, SolicitudCambio, Nota } from "@/lib/types";
import { notaPortal } from "@/lib/crm/notas";

type DB = {
  prospectos: Prospecto[];
  sitios: Sitio[];
  solicitudes: SolicitudCambio[];
  envios: { ip: string; t: string }[];
};

const vacia = (): DB => ({ prospectos: [], sitios: [], solicitudes: [], envios: [] });

function archivo(): string {
  return process.env.SKY_DATA_FILE ?? path.join(process.cwd(), ".data", "db.json");
}

let cola: Promise<unknown> = Promise.resolve();

async function leer(): Promise<DB> {
  try {
    const raw = await fs.readFile(archivo(), "utf8");
    return { ...vacia(), ...JSON.parse(raw) };
  } catch {
    return vacia();
  }
}

async function escribir(db: DB): Promise<void> {
  await fs.mkdir(path.dirname(archivo()), { recursive: true });
  const tmp = `${archivo()}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, archivo());
}

/** Serializa escrituras para no perder cambios concurrentes dentro del mismo proceso. */
function mutar<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const p = cola.then(async () => {
    const db = await leer();
    const r = await fn(db);
    await escribir(db);
    return r;
  });
  cola = p.catch(() => undefined);
  return p;
}

const ahora = () => new Date().toISOString();

/** Re-exportado por compatibilidad (antes vivía aquí). */
export { prospectoBase };

export const localRepo: Repo = {
  async listarProspectos() {
    return (await leer()).prospectos;
  },
  async obtenerProspecto(id) {
    return (await leer()).prospectos.find((p) => p.id === id) ?? null;
  },
  upsertProspectos(lista) {
    return mutar((db) => {
      let insertados = 0;
      let actualizados = 0;
      for (const p of lista) {
        const i = db.prospectos.findIndex((x) => x.id === p.id);
        if (i >= 0) {
          db.prospectos[i] = { ...db.prospectos[i], ...p, creado: db.prospectos[i].creado, actualizado: ahora() };
          actualizados++;
        } else {
          db.prospectos.push({ ...p, actualizado: ahora() });
          insertados++;
        }
      }
      return { insertados, actualizados };
    });
  },
  crearProspecto(p) {
    return mutar((db) => {
      const nuevo = prospectoBase(p);
      db.prospectos.push(nuevo);
      return nuevo;
    });
  },
  actualizarProspecto(id, cambios) {
    return mutar((db) => {
      const i = db.prospectos.findIndex((x) => x.id === id);
      if (i < 0) throw new Error("Prospecto no encontrado");
      db.prospectos[i] = { ...db.prospectos[i], ...cambios, id, actualizado: ahora() };
      return db.prospectos[i];
    });
  },
  agregarNota(id, nota: Nota) {
    return mutar((db) => {
      const p = db.prospectos.find((x) => x.id === id);
      if (!p) throw new Error("Prospecto no encontrado");
      p.notas = [...p.notas, nota];
      p.actualizado = ahora();
    });
  },
  async listarSitios() {
    return (await leer()).sitios;
  },
  async obtenerSitio(slug) {
    return (await leer()).sitios.find((s) => s.slug === slug) ?? null;
  },
  async obtenerSitioPorDominio(host) {
    return (await leer()).sitios.find((s) => s.dominio_propio === host) ?? null;
  },
  guardarSitio(s) {
    return mutar((db) => {
      const i = db.sitios.findIndex((x) => x.slug === s.slug);
      const fila: Sitio = { ...s, creado: s.creado ?? (i >= 0 ? db.sitios[i].creado : ahora()) };
      if (i >= 0) db.sitios[i] = fila;
      else db.sitios.push(fila);
      return fila;
    });
  },
  async contarSitiosActivos() {
    return (await leer()).sitios.filter((s) => s.tipo === "cliente" && s.activo).length;
  },
  async prospectoIdPorEmail(email) {
    const e = email.trim().toLowerCase();
    return (await leer()).prospectos.find((p) => p.email?.toLowerCase() === e)?.id ?? null;
  },
  crearSolicitudCambio(s) {
    return mutar((db) => {
      const fila: SolicitudCambio = { ...s, id: randomUUID(), creado: ahora() };
      db.solicitudes.push(fila);
      // Igual que el trigger de Supabase: la solicitud aparece como nota en el CRM.
      const p = db.prospectos.find((x) => x.id === s.prospecto_id);
      if (p) {
        p.notas = [...p.notas, { t: fila.creado, txt: notaPortal(s.texto, s.foto) }];
        p.actualizado = fila.creado;
      }
      return fila;
    });
  },
  registrarEnvio(ipHash, desde) {
    return mutar((db) => {
      const t = ahora();
      db.envios = db.envios.filter((e) => e.t >= desde);
      db.envios.push({ ip: ipHash, t });
      return db.envios.filter((e) => e.ip === ipHash).length;
    });
  },
  async volcarTodo() {
    const db = await leer();
    return { prospectos: db.prospectos, sitios: db.sitios, solicitudes_cambio: db.solicitudes };
  },
};

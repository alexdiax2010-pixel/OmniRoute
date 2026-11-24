import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { ETAPAS } from "@/lib/types";
import { PAQUETES, SERVICIOS, NOMBRE_SERVICIO } from "@/config/precios";
import { fechaCorta, fechaHora, hoyMX } from "@/lib/crm/fechas";
import { estadoSeguimiento } from "@/lib/crm/reglas";
import { proximoCobro, serviciosPorOfrecer } from "@/lib/crm/metricas";
import { carpetaDeBoceto, linkWa } from "@/lib/crm/texto";
import { leerNotaPortal } from "@/lib/crm/notas";
import { urlCliente, urlPropuesta } from "@/lib/crm/enlaces";
import { carpetaExiste } from "@/lib/crm/carpetas";
import { agregarNotaAccion, crearPropuesta, guardarDatos, guardarVenta, invitarPortal, moverEtapa, publicarSitio } from "../../acciones";
import { Copiar } from "../../_componentes/Copiar";
import { FormResultado } from "../../_componentes/FormResultado";
import s from "../../../admin.module.css";

export const metadata = { title: "Prospecto" };

export default async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  await requerirAdmin();
  const { id } = await params;
  const repo = await getRepo();
  const p = await repo.obtenerProspecto(decodeURIComponent(id));
  if (!p) notFound();
  const sitios = (await repo.listarSitios()).filter((x) => x.prospecto_id === p.id);
  const hoy = hoyMX();
  const wa = linkWa(p.whatsapp || p.telefono, p.mensaje);
  const seg = estadoSeguimiento(p.seguimiento, hoy);
  const cobro = proximoCobro(p.diaCobro, hoy);
  const digitosTel = p.telefono.replace(/\D/g, "");
  const tel = digitosTel.length >= 10 ? `tel:+${digitosTel.length === 10 ? `52${digitosTel}` : digitosTel}` : null;
  const fuenteUrl = /^https?:\/\/[^\s]+$/i.test(p.fuente) ? p.fuente : null;
  const carpetaBoceto = carpetaDeBoceto(p.boceto);
  const bocetoListo = carpetaBoceto ? carpetaExiste(carpetaBoceto) : false;
  const propuesta = sitios.find((x) => x.tipo === "propuesta" && x.activo);

  return (
    <>
      <p style={{ marginBottom: 8 }}>
        <Link href="/admin" className={s.muted}>
          ← Prospectos
        </Link>
      </p>
      <div className={s.entre} style={{ marginBottom: 12 }}>
        <h1 className={s.titulo} style={{ marginBottom: 0 }}>
          {p.nombre}
        </h1>
        <span className={`${s.badge} ${p.etapa === "Ganado" ? s.badgeOk : s.badgeEmber}`}>{p.etapa}</span>
      </div>
      <p className={s.muted}>
        {[p.giro, p.categoria, p.colonia].filter(Boolean).join(" · ") || "Sin giro"} · {p.puntaje} pts{p.top10 ? " · ★ Top 10" : ""}
        {p.sesion ? ` · Sesión ${p.sesion}` : ""}
        {p.fuente && !fuenteUrl ? ` · Fuente: ${p.fuente}` : ""}
        {fuenteUrl && (
          <>
            {" · "}
            <a href={fuenteUrl} target="_blank" rel="noopener noreferrer nofollow">
              Ver fuente
            </a>
          </>
        )}
      </p>
      {p.direccion && <p className={s.muted}>{p.direccion}</p>}

      {p.alertas.length > 0 && (
        <div className={s.alertas} role="note" style={{ marginTop: 16 }}>
          <strong>⚠ Verifica antes de contactar</strong>
          <ul>
            {p.alertas.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <section className={s.card} style={{ marginTop: 16 }} aria-labelledby="contacto">
        <h2 id="contacto" className={s.sub} style={{ marginTop: 0 }}>
          Contacto
        </h2>
        <p>
          Tel: <strong>{p.telefono || "—"}</strong> · WhatsApp: <strong>{p.whatsapp || "—"}</strong>
        </p>
        <p className={seg === "vencido" ? s.vencido : seg === "hoy" ? s.hoy : s.muted}>
          Seguimiento: {fechaCorta(p.seguimiento)}
          {seg === "vencido" ? " (vencido)" : seg === "hoy" ? " (hoy)" : ""}
        </p>
        <div className={s.fila} style={{ marginTop: 12 }}>
          <Copiar texto={p.mensaje} etiqueta="Copiar mensaje" />
          <Copiar texto={p.whatsapp || p.telefono} etiqueta="Copiar teléfono" />
          {tel && (
            <a href={tel} className={s.btn}>
              Llamar
            </a>
          )}
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={`${s.btn} ${s.btnWa}`}>
              Abrir WhatsApp
            </a>
          ) : (
            <span className={s.muted}>Sin WhatsApp válido</span>
          )}
        </div>
        <form action={moverEtapa} className={s.fila} style={{ marginTop: 12 }}>
          <input type="hidden" name="id" value={p.id} />
          <label htmlFor="etapa-detalle" className={s.leyenda}>
            Etapa
          </label>
          <select id="etapa-detalle" name="etapa" defaultValue={p.etapa} className={s.select} style={{ maxWidth: 240 }}>
            {ETAPAS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
          <button type="submit" className={`${s.btn} ${s.btnPrimario}`}>
            Cambiar etapa
          </button>
        </form>
      </section>

      <div className={s.grid2} style={{ marginTop: 16 }}>
        <section className={s.card} aria-labelledby="msg">
          <h2 id="msg" className={s.sub} style={{ marginTop: 0 }}>
            Mensaje
          </h2>
          <p className={s.pre}>{p.mensaje || <span className={s.muted}>Sin mensaje</span>}</p>
          <h2 className={s.sub}>Guion de llamada</h2>
          <p className={s.pre}>{p.guion || <span className={s.muted}>Sin guion</span>}</p>
          {p.razon && (
            <>
              <h2 className={s.sub}>Por qué es buen prospecto</h2>
              <p className={s.pre}>{p.razon}</p>
            </>
          )}
        </section>

        <section className={s.card} aria-labelledby="notas">
          <h2 id="notas" className={s.sub} style={{ marginTop: 0 }}>
            Notas
          </h2>
          <form action={agregarNotaAccion} className={s.form} style={{ marginBottom: 12 }}>
            <input type="hidden" name="id" value={p.id} />
            <label htmlFor="txt" className="sr-only">
              Nueva nota
            </label>
            <textarea id="txt" name="txt" required maxLength={2000} className={s.textarea} placeholder="Escribe una nota…" />
            <div>
              <button type="submit" className={s.btn}>
                Agregar nota
              </button>
            </div>
          </form>
          <ul className={s.notas}>
            {[...p.notas].reverse().map((n, i) => {
              const portal = leerNotaPortal(n.txt);
              return (
                <li key={i} className={`${s.nota} ${portal ? s.notaPortal : ""}`}>
                  <div className={s.notaFecha}>{n.t ? fechaHora(n.t) : "Sin fecha"}</div>
                  {portal ? (
                    <div className={s.pre}>
                      <strong>[Portal]</strong> {portal.texto}
                      {portal.foto && (
                        <>
                          {" "}
                          <a href={`/admin/foto?ruta=${encodeURIComponent(portal.foto)}`} target="_blank" rel="noopener noreferrer">
                            Ver foto
                          </a>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className={s.pre}>{n.txt}</div>
                  )}
                </li>
              );
            })}
            {p.notas.length === 0 && <li className={s.muted}>Sin notas.</li>}
          </ul>
        </section>
      </div>

      <section className={s.card} style={{ marginTop: 16 }} aria-labelledby="sitios">
        <h2 id="sitios" className={s.sub} style={{ marginTop: 0 }}>
          Propuesta y sitio
        </h2>
        {p.boceto && (
          <p style={{ marginBottom: 12 }}>
            Boceto: <code>{p.boceto}</code>{" "}
            {propuesta ? (
              <a href={urlPropuesta(propuesta.slug)} target="_blank" rel="noopener noreferrer">
                Abrir propuesta
              </a>
            ) : carpetaBoceto && bocetoListo ? (
              <span className={s.ok}>listo en clientes/{carpetaBoceto} — usa “Crear propuesta” para tener el enlace.</span>
            ) : (
              <span className={s.muted}>
                aún no está en <code>clientes/{carpetaBoceto ?? "…"}</code>.
              </span>
            )}
          </p>
        )}
        {sitios.length > 0 && (
          <ul className={s.notas} style={{ marginBottom: 12 }}>
            {sitios.map((x) => {
              const enlace = x.tipo === "propuesta" ? urlPropuesta(x.slug) : urlCliente(x.slug);
              const existe = carpetaExiste(x.carpeta);
              return (
                <li key={x.slug} className={s.nota}>
                  <div className={s.fila}>
                    <span className={s.badge}>{x.tipo === "propuesta" ? "Propuesta" : "Sitio cliente"}</span>
                    <a href={enlace} target="_blank" rel="noopener noreferrer">
                      {enlace}
                    </a>
                    <span className={s.muted}>
                      {x.activo ? "activo" : "inactivo"}
                      {x.expira ? ` · vence ${fechaCorta(x.expira)}` : ""}
                    </span>
                  </div>
                  {!existe && (
                    <div className={s.aviso} style={{ marginTop: 8 }}>
                      Falta la carpeta <code>clientes/{x.carpeta}</code>. Créala con:
                      <code className={s.codigo}>{`npm run sitio:nuevo -- ${x.slug} ${x.carpeta} --tipo ${x.tipo}`}</code>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className={s.grid2}>
          <FormResultado accion={crearPropuesta} boton="Crear propuesta" primario>
            <input type="hidden" name="id" value={p.id} />
            <p className={s.muted}>Crea el enlace propuesta (vence en 30 días) y lo agrega al mensaje de WhatsApp.</p>
          </FormResultado>
          {p.etapa === "Ganado" ? (
            <FormResultado accion={publicarSitio} boton="Publicar sitio" primario>
              <input type="hidden" name="id" value={p.id} />
              <p className={s.muted}>Publica su página en su propio subdominio (sin vencimiento).</p>
            </FormResultado>
          ) : (
            <p className={s.muted}>“Publicar sitio” e “Invitar al portal” aparecen cuando el prospecto está en Ganado.</p>
          )}
        </div>
        {p.etapa === "Ganado" && (
          <div style={{ marginTop: 16 }}>
            <FormResultado accion={invitarPortal} boton="Invitar al portal">
              <input type="hidden" name="id" value={p.id} />
              <label className={s.campo}>
                <span>Correo del cliente</span>
                <input name="email" type="email" required defaultValue={p.email ?? ""} className={s.input} autoComplete="off" />
              </label>
            </FormResultado>
          </div>
        )}
      </section>

      <section className={s.card} style={{ marginTop: 16 }} aria-labelledby="venta">
        <h2 id="venta" className={s.sub} style={{ marginTop: 0 }}>
          Venta
        </h2>
        <FormResultado accion={guardarVenta} boton="Guardar venta">
          <input type="hidden" name="id" value={p.id} />
          <div className={s.campos}>
            <label className={s.campo}>
              <span>Paquete</span>
              <select name="paquete" defaultValue={p.paquete ?? ""} className={s.select}>
                <option value="">Sin paquete</option>
                {PAQUETES.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className={s.campo}>
              <span>Monto (MXN)</span>
              <input name="monto" inputMode="decimal" defaultValue={p.monto ?? ""} className={s.input} />
            </label>
            <label className={s.campo}>
              <span>Mensualidad (MXN)</span>
              <input name="mensualidad" inputMode="decimal" defaultValue={p.mensualidad ?? ""} className={s.input} />
            </label>
            <label className={s.campo}>
              <span>Día de cobro (1–31)</span>
              <input name="diaCobro" type="number" min={1} max={31} defaultValue={p.diaCobro ?? ""} className={s.input} />
            </label>
          </div>
          <fieldset className={s.grupo}>
            <legend className={s.leyenda}>Servicios</legend>
            {SERVICIOS.map((x) => (
              <label key={x} className={s.check}>
                <input type="checkbox" name="servicios" value={x} defaultChecked={p.servicios.includes(x)} /> {NOMBRE_SERVICIO[x]}
              </label>
            ))}
          </fieldset>
          <p className={s.muted}>
            {p.fechaGanado ? `Ganado el ${fechaCorta(p.fechaGanado)}. ` : ""}
            {cobro ? `Próximo cobro: ${fechaCorta(cobro)}. ` : ""}
            {p.etapa === "Ganado" && serviciosPorOfrecer(p.servicios).length > 0 ? `Puedes ofrecerle: ${serviciosPorOfrecer(p.servicios).join(", ")}.` : ""}
          </p>
        </FormResultado>
      </section>

      <section className={s.card} style={{ marginTop: 16 }} aria-labelledby="datos">
        <h2 id="datos" className={s.sub} style={{ marginTop: 0 }}>
          Editar datos
        </h2>
        <FormResultado accion={guardarDatos} boton="Guardar datos">
          <input type="hidden" name="id" value={p.id} />
          <div className={s.campos}>
            {(
              [
                ["nombre", "Nombre del negocio", p.nombre],
                ["giro", "Giro", p.giro],
                ["categoria", "Categoría", p.categoria],
                ["colonia", "Colonia", p.colonia],
                ["direccion", "Dirección", p.direccion],
                ["telefono", "Teléfono", p.telefono],
                ["whatsapp", "WhatsApp", p.whatsapp],
                ["puntaje", "Puntaje", String(p.puntaje)],
                ["boceto", "Boceto (carpeta en clientes/)", p.boceto],
                ["email", "Correo del cliente", p.email ?? ""],
              ] as const
            ).map(([n, l, v]) => (
              <label key={n} className={s.campo}>
                <span>{l}</span>
                <input name={n} defaultValue={v} className={s.input} type={n === "email" ? "email" : "text"} required={n === "nombre"} />
              </label>
            ))}
            <label className={s.campo}>
              <span>Seguimiento</span>
              <input name="seguimiento" type="date" defaultValue={p.seguimiento ?? ""} className={s.input} />
            </label>
            <label className={s.check} style={{ alignSelf: "end" }}>
              <input type="checkbox" name="top10" defaultChecked={p.top10} /> Top 10
            </label>
          </div>
          <label className={s.campo}>
            <span>Alertas de verificación (una por línea)</span>
            <textarea name="alertas" defaultValue={p.alertas.join("\n")} className={s.textarea} />
          </label>
          <label className={s.campo}>
            <span>Mensaje de WhatsApp</span>
            <textarea name="mensaje" defaultValue={p.mensaje} className={s.textarea} />
          </label>
          <label className={s.campo}>
            <span>Guion de llamada</span>
            <textarea name="guion" defaultValue={p.guion} className={s.textarea} />
          </label>
          <label className={s.campo}>
            <span>Razón</span>
            <textarea name="razon" defaultValue={p.razon} className={s.textarea} />
          </label>
        </FormResultado>
      </section>
    </>
  );
}

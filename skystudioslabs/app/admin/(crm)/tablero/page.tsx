import { requerirAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { hoyMX } from "@/lib/crm/fechas";
import { Kanban, type TarjetaKanban } from "../_componentes/Kanban";
import s from "../../admin.module.css";

export const metadata = { title: "Tablero" };

export default async function Tablero() {
  await requerirAdmin();
  const lista = await (await getRepo()).listarProspectos();
  // Solo los campos que la tarjeta necesita viajan al navegador (sin teléfonos ni notas).
  const tarjetas: TarjetaKanban[] = lista
    .sort((a, b) => b.puntaje - a.puntaje)
    .map((p) => ({ id: p.id, nombre: p.nombre, etapa: p.etapa, puntaje: p.puntaje, colonia: p.colonia, seguimiento: p.seguimiento, top10: p.top10 }));
  return (
    <>
      <h1 className={s.titulo}>
        Tablero <em>ventas</em>
      </h1>
      <p className={s.muted}>Arrastra las tarjetas entre columnas, o usa “Mover” en cada tarjeta (funciona con teclado).</p>
      <Kanban tarjetas={tarjetas} hoy={hoyMX()} />
    </>
  );
}

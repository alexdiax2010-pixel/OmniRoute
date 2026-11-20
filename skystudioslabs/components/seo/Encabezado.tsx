import { Hl } from "./Hl";
import s from "./seo.module.css";

/** Encabezado de sección: antetítulo + h2 (t-title) con *resaltado* opcional. */
export function Encabezado({ antetitulo, titulo, id, children }: { antetitulo?: string; titulo: string; id?: string; children?: React.ReactNode }) {
  return (
    <div className={s.encabezado}>
      {antetitulo ? <p className={s.antetitulo}>{antetitulo}</p> : null}
      <h2 className="t-title" id={id}>
        <Hl texto={titulo} />
      </h2>
      {children ? <p className={`muted ${s.encabezadoTexto}`}>{children}</p> : null}
    </div>
  );
}

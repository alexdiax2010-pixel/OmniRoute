import { Fragment } from "react";

/** Convierte "texto con *palabra*" en texto con <em className="hl">palabra</em>. */
export function Hl({ texto }: { texto: string }) {
  const partes = texto.split(/\*([^*]+)\*/g);
  return (
    <>
      {partes.map((parte, i) =>
        i % 2 === 1 ? (
          <em key={i} className="hl">
            {parte}
          </em>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        )
      )}
    </>
  );
}

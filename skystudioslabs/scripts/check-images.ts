/**
 * npm run check:images — falla si alguna imagen de public/ o clientes/ pesa más de 300 KB.
 */
import path from "node:path";
import { buscarImagenesPesadas, formatearKB, LIMITE_IMAGEN } from "../lib/sitios/imagenes";

const raiz = process.cwd();
const dirs = ["public", "clientes"].map((d) => path.join(raiz, d));
const pesadas = await buscarImagenesPesadas(dirs);

if (pesadas.length) {
  console.error(`✗ ${pesadas.length} imagen(es) superan ${formatearKB(LIMITE_IMAGEN)}:`);
  for (const p of pesadas) console.error(`  - ${path.relative(raiz, p.ruta)}  (${formatearKB(p.bytes)})`);
  console.error("Optimízalas (WebP/AVIF, menor resolución) antes de publicar.");
  process.exit(1);
}
console.log(`✓ Todas las imágenes de public/ y clientes/ pesan ${formatearKB(LIMITE_IMAGEN)} o menos.`);

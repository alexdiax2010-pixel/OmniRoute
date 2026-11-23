// Genera las capas de texto (PNG transparente 1280x720) y sus vistas previas.
// Uso (desde version-superior/miniaturas):  node herramientas/generar-capas.cjs
// Requiere: Node + playwright (con chromium instalado). Fuente: fuentes/Anton-Regular.ttf (SIL OFL 1.1).
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "variantes.json"), "utf8"));
const FONT_B64 = fs.readFileSync(path.join(ROOT, "fuentes", "Anton-Regular.ttf")).toString("base64");
const OUT_CAPAS = path.join(ROOT, "capas");
const OUT_PREV = path.join(ROOT, "previews");
fs.mkdirSync(OUT_CAPAS, { recursive: true });
fs.mkdirSync(OUT_PREV, { recursive: true });

const AMARILLO = "#FFD400";
const ROJO = "#E10600";

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function lineaHtml(linea) {
  // [palabra] -> span amarillo con marca para el elemento rojo
  const html = esc(linea).replace(/\[([^\]]+)\]/g, '<span class="kw">$1</span>');
  const tieneKw = /\[/.test(linea);
  return `<div class="ln${tieneKw ? " has-kw" : ""}">${html}</div>`;
}

function capaHtml(v) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Anton;src:url(data:font/ttf;base64,${FONT_B64}) format("truetype");}
html,body{margin:0;width:1280px;height:720px;background:transparent;overflow:hidden;}
#stage{position:relative;width:1280px;height:720px;}
/* sombreado oscuro a la izquierda: ayuda a leer sobre cualquier foto (estilo fondo oscuro) */
#grad{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.62) 0%,rgba(0,0,0,.45) 38%,rgba(0,0,0,0) 66%);}
#txt{position:absolute;left:64px;top:50%;transform:translateY(-50%);max-width:760px;}
.ln{font-family:Anton,Impact,"Arial Black",sans-serif;color:#fff;text-transform:uppercase;
  line-height:1.08;white-space:nowrap;letter-spacing:1px;
  text-shadow:
   -5px -5px 0 #000, 5px -5px 0 #000, -5px 5px 0 #000, 5px 5px 0 #000,
   0 -6px 0 #000, 0 6px 0 #000, -6px 0 0 #000, 6px 0 0 #000,
   10px 12px 14px rgba(0,0,0,.85);}
.kw{color:${AMARILLO};}
.bar{position:absolute;height:20px;background:${ROJO};border-radius:10px;transform:rotate(-2deg);
  box-shadow:0 0 0 4px #000, 6px 8px 10px rgba(0,0,0,.7);}
svg{position:absolute;overflow:visible;}
</style></head><body><div id="stage"><div id="grad"></div>
<div id="txt">${v.lineas.map(lineaHtml).join("")}</div></div>
<script>
(() => {
const MAXW = 740, kwMax = 220, otherMax = 170, kwMin = 90;
document.fonts.ready.then(() => {
  const lines = [...document.querySelectorAll('.ln')];
  for (const ln of lines) {
    let fs = ln.classList.contains('has-kw') ? kwMax : otherMax;
    ln.style.fontSize = fs + 'px';
    while (ln.scrollWidth > MAXW && fs > kwMin) { fs -= 2; ln.style.fontSize = fs + 'px'; }
  }
  // con subrayado, deja aire bajo la línea de la palabra clave para que la barra no pise la siguiente línea
  if (${JSON.stringify(v.rojo)} === 'subrayado') {
    for (const ln of lines) if (ln.classList.contains('has-kw') && ln.nextElementSibling)
      ln.style.marginBottom = Math.round(parseFloat(ln.style.fontSize) * 0.2) + 'px';
  }
  // altura total máxima ~600px
  const txt = document.getElementById('txt');
  while (txt.getBoundingClientRect().height > 600) {
    for (const ln of lines) ln.style.fontSize = (parseFloat(ln.style.fontSize) - 2) + 'px';
  }
  const stage = document.getElementById('stage');
  const kw = document.querySelector('.kw').getBoundingClientRect();
  const mode = ${JSON.stringify(v.rojo)};
  if (mode === 'subrayado') {
    const b = document.createElement('div'); b.className = 'bar';
    // Anton tiene poco descendente: el subrayado va justo bajo la base de la palabra
    b.style.left = (kw.left - 6) + 'px'; b.style.width = (kw.width + 12) + 'px';
    b.style.top = (kw.bottom - kw.height * 0.06) + 'px';
    stage.appendChild(b);
  } else {
    // flecha curva desde la derecha del bloque de texto hacia el centro-derecha (donde suele ir el sujeto)
    const t = txt.getBoundingClientRect();
    const x0 = Math.min(t.right + 28, 900), y0 = kw.top + kw.height * 0.5;
    const x1 = Math.min(x0 + 230, 1180), y1 = Math.max(Math.min(y0 - 120, 600), 120);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', 1280); svg.setAttribute('height', 720);
    svg.style.left = 0; svg.style.top = 0;
    const cx = (x0 + x1) / 2 + 10, cy = Math.max(y0, y1) + 40;
    const d = 'M' + x0 + ' ' + y0 + ' Q ' + cx + ' ' + cy + ' ' + x1 + ' ' + y1;
    // punta: dirección final de la curva (tangente en t=1 = x1-cx, y1-cy)
    const ang = Math.atan2(y1 - cy, x1 - cx), L = 54, W = 0.55;
    const p1 = [x1 - L * Math.cos(ang - W), y1 - L * Math.sin(ang - W)];
    const p2 = [x1 - L * Math.cos(ang + W), y1 - L * Math.sin(ang + W)];
    const tip = [x1 + 14 * Math.cos(ang), y1 + 14 * Math.sin(ang)];
    const head = 'M' + p1.join(' ') + ' L' + tip.join(' ') + ' L' + p2.join(' ') + ' Z';
    svg.innerHTML =
      '<path d="' + d + '" fill="none" stroke="#000" stroke-width="30" stroke-linecap="round"/>' +
      '<path d="' + head + '" fill="#000" stroke="#000" stroke-width="12" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="${ROJO}" stroke-width="18" stroke-linecap="round"/>' +
      '<path d="' + head + '" fill="${ROJO}"/>';
    stage.appendChild(svg);
  }
  document.body.dataset.ready = '1';
});
})();
</script></body></html>`;
}

// Fondo de prueba oscuro (solo formas, sin fotos de terceros): degradado + silueta gris a la derecha
const FONDO_PRUEBA = `background:
  radial-gradient(ellipse 22% 40% at 76% 46%, #4a4f57 0%, #3a3e45 60%, transparent 61%),
  radial-gradient(circle at 76% 22%, #565b63 0 9%, transparent 9.3%),
  radial-gradient(ellipse at 70% 40%, #2b2f36 0%, #15171b 60%, #0b0c0e 100%);`;

function previewHtml(capaB64) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#0e0f12;font-family:sans-serif;color:#aaa;}
.wrap{display:flex;gap:20px;padding:20px;align-items:flex-start;}
.f{position:relative;${FONDO_PRUEBA}}
.f img{position:absolute;inset:0;width:100%;height:100%;}
.big{width:640px;height:360px;} .small{width:320px;height:180px;}
.lbl{font-size:13px;margin-top:6px;}
</style></head><body><div class="wrap">
<div><div class="f big"><img src="data:image/png;base64,${capaB64}"></div><div class="lbl">640×360</div></div>
<div><div class="f small"><img src="data:image/png;base64,${capaB64}"></div><div class="lbl">320×180 (tamaño en la lista de YouTube)</div></div>
</div></body></html>`;
}

function hojaHtml(items) {
  const filas = DATA.videos
    .map((vid) => {
      const celdas = vid.variantes
        .map(
          (v) =>
            `<div><div class="f"><img src="data:image/png;base64,${items[v.id]}"></div><div class="lbl">${v.id}</div></div>`
        )
        .join("");
      return `<div class="row"><div class="vn">V${vid.video}</div>${celdas}</div>`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#0e0f12;font-family:sans-serif;color:#bbb;}
.row{display:flex;gap:16px;padding:10px 16px;align-items:center;}
.vn{width:40px;font-size:20px;font-weight:bold;}
.f{position:relative;width:320px;height:180px;${FONDO_PRUEBA}}
.f img{position:absolute;inset:0;width:100%;height:100%;}
.lbl{font-size:12px;margin-top:4px;}
</style></head><body><div style="padding:10px 16px 0">Todas las capas a 320×180 sobre fondo de prueba</div>${filas}</body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", (e) => console.error("ERROR en página:", e.message));
  const items = {};
  for (const vid of DATA.videos) {
    for (const v of vid.variantes) {
      await page.setContent(capaHtml(v));
      await page.waitForSelector("body[data-ready='1']", { state: "attached", timeout: 15000 });
      const file = path.join(OUT_CAPAS, `${v.id}.png`);
      await page.screenshot({ path: file, omitBackground: true });
      items[v.id] = fs.readFileSync(file).toString("base64");
      console.log("capa", file, Math.round(fs.statSync(file).size / 1024) + " KB");
    }
  }
  const prev = await browser.newPage({ viewport: { width: 1020, height: 420 } });
  for (const id of Object.keys(items)) {
    await prev.setContent(previewHtml(items[id]));
    await prev.waitForLoadState("load");
    const file = path.join(OUT_PREV, `${id}-preview.png`);
    await prev.screenshot({ path: file, clip: { x: 0, y: 0, width: 1020, height: 420 } });
  }
  const hoja = await browser.newPage({ viewport: { width: 1120, height: 1060 } });
  await hoja.setContent(hojaHtml(items));
  await hoja.waitForLoadState("load");
  await hoja.screenshot({ path: path.join(OUT_PREV, "hoja-320x180.jpg"), fullPage: true, type: "jpeg", quality: 85 });
  await browser.close();
  console.log("listo");
})();

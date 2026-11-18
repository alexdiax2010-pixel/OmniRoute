#!/usr/bin/env node
/**
 * generar.mjs — Genera los materiales para WhatsApp de cada boceto.
 *
 *   node generar.mjs todos               → los 13 negocios
 *   node generar.mjs dental-prados       → solo uno (nombre de su carpeta)
 *   node generar.mjs frenos-frescos dr-llamas   → varios
 *   node generar.mjs todos --video       → además graba la intro (intro.webm + intro.mp4)
 *   node generar.mjs dr-llamas --solo-video  → solo el video de la intro
 *
 * Por cada negocio lee <giro>/<negocio>/propuesta.json y escribe en esa carpeta:
 *   mockup-celular.png (1080x1350) · mockup-escritorio.png (1920x1080)
 *   mockup-combo.png (1920x1080)   · propuesta.pdf (carta, 2 páginas)
 *
 * Video: graba la intro cinematográfica a 390x844 (~5 s: intro + scroll suave) con recordVideo.
 *   Si hay ffmpeg, recorta el arranque en blanco y genera intro.mp4 (H.264, ideal para WhatsApp).
 *
 * Plantillas: _plantillas/{celular,escritorio,combo,propuesta}.html con marcadores {{clave}}.
 * Requiere Playwright con Chromium (npm i playwright && npx playwright install chromium).
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = dirname(fileURLToPath(import.meta.url));
const GIROS = ['dentistas', 'talleres', 'barberias'];
const INCLUYE = [
  'Diseño responsive: se ve bien en celular, tablet y computadora',
  'Botón de WhatsApp para que te escriban con un toque',
  'Mapa de Google con tu ubicación y botón “Cómo llegar”',
  'SEO local: configurado para búsquedas en Zapopan',
  'Hosting incluido el primer año',
  '2 rondas de cambios sobre el diseño',
];

// ---------- utilidades ----------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dataUri = (buf, mime = 'image/png') => `data:${mime};base64,${buf.toString('base64')}`;
function fill(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`Falta el valor {{${k}}} para la plantilla`);
    return vars[k];
  });
}
function luminance(rgb) {
  const m = String(rgb).match(/\d+(\.\d+)?/g);
  if (!m) return 1;
  const [r, g, b] = m.slice(0, 3).map((v) => { v = +v / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function listarNegocios() {
  const out = [];
  for (const giro of GIROS) {
    const dir = join(ROOT, giro);
    if (!existsSync(dir)) continue;
    for (const n of readdirSync(dir, { withFileTypes: true })) {
      if (n.isDirectory() && existsSync(join(dir, n.name, 'index.html'))) out.push({ giro, slug: n.name, dir: join(dir, n.name) });
    }
  }
  return out;
}

// ---------- capturas de la página ----------
async function capturar(browser, negocio, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(join(negocio.dir, 'index.html')).href, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  // La franja de boceto puede quedar fuera de las capturas (sí va en el PDF y en los marcos).
  await page.addStyleTag({ content: '.franja-boceto{display:none!important}' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  // Recorre la página para disparar las animaciones de aparición (IntersectionObserver) y vuelve arriba.
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += Math.round(innerHeight / 2)) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
  // Color del área superior, para pintar la barra de estado del celular.
  const barra = await page.evaluate(() => {
    let el = document.elementFromPoint(4, 4);
    while (el) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return bg;
      el = el.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor || '#ffffff';
  });
  const buf = await page.screenshot({ type: 'png' });
  await ctx.close();
  return { buf, barra };
}

// ---------- render de una plantilla HTML ----------
async function render(browser, plantilla, vars, { width, height, out, type = 'png', quality }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const html = fill(readFileSync(join(ROOT, '_plantillas', plantilla), 'utf8'), vars);
  await page.setContent(html, { waitUntil: 'networkidle', timeout: 45000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(250);
  const buf = await page.screenshot({ type, quality, clip: { x: 0, y: 0, width, height } });
  if (out) writeFileSync(out, buf);
  await ctx.close();
  return buf;
}

async function pdf(browser, vars, out) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const html = fill(readFileSync(join(ROOT, '_plantillas', 'propuesta.html'), 'utf8'), vars);
  await page.setContent(html, { waitUntil: 'networkidle', timeout: 45000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.pdf({ path: out, format: 'Letter', printBackground: true, preferCSSPageSize: true });
  await ctx.close();
}

// ---------- un negocio ----------
async function generar(browser, negocio) {
  const cfgPath = join(negocio.dir, 'propuesta.json');
  if (!existsSync(cfgPath)) throw new Error(`No existe ${cfgPath}`);
  const c = JSON.parse(readFileSync(cfgPath, 'utf8'));
  const col = c.colores, f = c.fuentes;
  if (!Array.isArray(c.beneficios) || c.beneficios.length < 3 || c.beneficios.length > 4) throw new Error('propuesta.json: "beneficios" debe tener 3 o 4 elementos');

  const movil = await capturar(browser, negocio, 390, 844);
  const escritorio = await capturar(browser, negocio, 1440, 900);
  const oscuraArriba = luminance(movil.barra) < 0.4;

  const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const vars = {
    nombre: esc(c.nombre),
    nombreCorto: esc(c.nombreCorto || c.nombre),
    giroLinea: esc(c.giroLinea),
    direccion: esc(c.direccion),
    dominio: esc(c.dominio),
    fecha: esc(fecha),
    oscuro: col.oscuro, medio: col.medio, acento: col.acento,
    sobreOscuro: col.sobreOscuro || '#ffffff',
    acentoTexto: col.acentoTexto || '#ffffff',
    fontUrl: esc(f.url),
    fuenteTitulo: f.titulo, fuenteTexto: f.texto,
    pesoTitulo: String(f.pesoTitulo || 700),
    mayusTitulo: f.mayusculas ? 'uppercase' : 'none',
    trackTitulo: f.tracking || '-0.01em',
    trackTituloPdf: f.mayusculas ? '0.01em' : (f.tracking || '-0.01em'),
    tamTitulo: f.tamTitulo || '84px',
    barraColor: movil.barra,
    barraTinta: oscuraArriba ? '#ffffff' : '#111111',
    capturaMovil: dataUri(movil.buf),
    capturaEscritorio: dataUri(escritorio.buf),
    beneficiosHtml: c.beneficios.map((b) => `<div class="benefit"><h3>${esc(b.titulo)}</h3><p>${esc(b.texto)}</p></div>`).join(''),
    incluyeHtml: INCLUYE.map((t) => `<li><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10"/><path d="M6 10.5l2.6 2.6L14.2 7.5" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${esc(t)}</li>`).join(''),
  };

  await render(browser, 'celular.html', vars, { width: 1080, height: 1350, out: join(negocio.dir, 'mockup-celular.png') });
  await render(browser, 'escritorio.html', vars, { width: 1920, height: 1080, out: join(negocio.dir, 'mockup-escritorio.png') });
  await render(browser, 'combo.html', vars, { width: 1920, height: 1080, out: join(negocio.dir, 'mockup-combo.png') });
  const comboJpg = await render(browser, 'combo.html', vars, { width: 1920, height: 1080, type: 'jpeg', quality: 86 });
  await pdf(browser, { ...vars, comboImg: dataUri(comboJpg, 'image/jpeg') }, join(negocio.dir, 'propuesta.pdf'));
}


// ---------- video de la intro ----------
function hayFfmpeg() {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; }
}
async function grabarIntro(browser, negocio) {
  const tmp = mkdtempSync(join(tmpdir(), 'intro-'));
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    recordVideo: { dir: tmp, size: { width: 780, height: 1688 } },
  });
  const t0 = Date.now();
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(join(negocio.dir, 'index.html')).href, { waitUntil: 'commit' });
  const inicio = Math.max(0, (Date.now() - t0) / 1000 - 0.05);
  await page.waitForTimeout(3300);                       // intro completa (< 3 s) + respiro
  await page.evaluate(async () => {                      // scroll suave ~1.6 s
    const dur = 1600, fin = performance.now() + dur;
    const H = Math.min(document.documentElement.scrollHeight - innerHeight, innerHeight * 1.5);
    while (performance.now() < fin) {
      const p = 1 - (fin - performance.now()) / dur;
      scrollTo(0, H * (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2));
      await new Promise((r) => requestAnimationFrame(r));
    }
  });
  await page.waitForTimeout(500);
  const video = page.video();
  await ctx.close();
  const crudo = await video.path();
  const webm = join(negocio.dir, 'intro.webm'), mp4 = join(negocio.dir, 'intro.mp4');
  if (hayFfmpeg()) {
    const ss = ['-y', '-loglevel', 'error', '-ss', inicio.toFixed(2), '-i', crudo, '-an', '-t', '5.6'];
    execFileSync('ffmpeg', [...ss, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '32', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', webm]);
    execFileSync('ffmpeg', [...ss, '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '30', mp4]);
  } else {
    copyFileSync(crudo, webm);
    console.warn('  (sin ffmpeg: solo intro.webm, sin recortar)');
  }
  rmSync(tmp, { recursive: true, force: true });
}

// ---------- CLI ----------
const argv = process.argv.slice(2);
const conVideo = argv.includes('--video'), soloVideo = argv.includes('--solo-video');
const args = argv.filter((a) => !a.startsWith('--'));
const todos = listarNegocios();
if (!args.length) {
  console.log('Uso: node generar.mjs <negocio|todos> [otro-negocio ...] [--video | --solo-video]\nNegocios: ' + todos.map((n) => n.slug).join(', '));
  process.exit(1);
}
const elegidos = args.includes('todos') ? todos : args.map((a) => {
  const n = todos.find((x) => x.slug === a);
  if (!n) { console.error(`Negocio desconocido: ${a}\nOpciones: ${todos.map((x) => x.slug).join(', ')}`); process.exit(1); }
  return n;
});

const browser = await chromium.launch();
let fallos = 0;
for (const n of elegidos) {
  const t = Date.now();
  try {
    if (!soloVideo) await generar(browser, n);
    if (conVideo || soloVideo) await grabarIntro(browser, n);
    console.log(`✔ ${n.giro}/${n.slug}  (${((Date.now() - t) / 1000).toFixed(1)} s)`);
  } catch (e) {
    fallos++;
    console.error(`✘ ${n.giro}/${n.slug}: ${e.message}`);
  }
}
await browser.close();
process.exit(fallos ? 1 : 0);

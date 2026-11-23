// Genera shorts/plan-shorts.json y shorts/plan-shorts.md a partir de los guiones exactos
// (guiones/originales/videoNN.txt). El texto de cada short se EXTRAE del guion (no se reescribe):
// se busca la frase "desde" y la frase "hasta" y se toma todo lo que hay entre ellas, inclusive.
// Tiempos: proporción de palabras sobre la duración total del audio (aproximados, ver README).
// Uso (desde version-superior/shorts):  node herramientas/generar-plan.cjs
const fs = require("fs");
const path = require("path");

const SHORTS = path.resolve(__dirname, "..");
const GUIONES = path.resolve(SHORTS, "..", "guiones", "originales");

const VIDEOS = {
  2: { dur: 515, puntos: 12, titulo: "12 Hábitos que te Hacen Ver MAYOR (sin darte cuenta)" },
  3: { dur: 502.1, puntos: 10, titulo: "Cómo OLER CARO Gastando POCO (guía completa)" },
  4: { dur: 516, puntos: 9, titulo: "9 Cosas que MATAN tu Confianza (cada mañana)" },
  5: { dur: 511.6, puntos: 7, titulo: "La RUTINA de Piel MÁS FÁCIL para Hombres (5 minutos)" },
};

const SPEC = [
  // ---- Video 2
  { id: "s02-1", video: 2, desde: "Vestirte como señor antes de tiempo.", hasta: "y eso se nota desde lejos.",
    gancho: ["¿TE VISTES", "COMO TU TÍO?"], titulo: "Deja de vestirte como señor a los 25",
    hashtags: ["#estilohombre", "#modamasculina", "#shorts"] },
  { id: "s02-2", video: 2, desde: "Traer el ceño fruncido todo el tiempo.", hasta: "Una cara relajada se ve más joven y más accesible.",
    gancho: ["ESA CARA", "TE SUMA AÑOS"], titulo: "Tu cara de enojo te hace ver mayor (y ni lo notas)",
    hashtags: ["#cuidadopersonal", "#hombres", "#shorts"] },
  { id: "s02-3", video: 2, desde: "Y el que más pesa de todos: no usar bloqueador solar.", hasta: "Tu yo de cuarenta te lo va a agradecer.", etiqueta: "No usar bloqueador solar",
    gancho: ["EL HÁBITO QUE", "MÁS AÑOS TE SUMA"], titulo: "El hábito que más te hace ver mayor",
    hashtags: ["#cuidadodelapiel", "#bloqueadorsolar", "#shorts"] },
  // ---- Video 3
  { id: "s03-1", video: 3, desde: "Calcula cuánto aplicar.", hasta: "Eso es ahorro directo.",
    gancho: ["¿CUÁNTAS VECES", "TE PERFUMAS?"], titulo: "¿Cuántas atomizaciones de perfume son suficientes?",
    hashtags: ["#perfumes", "#olerbien", "#shorts"] },
  { id: "s03-2", video: 3, desde: "Cuida el frasco como si fuera oro.", hasta: "Y un perfume que no se echa a perder es dinero que no tiras.",
    gancho: ["NUNCA GUARDES", "TU PERFUME AHÍ"], titulo: "Por qué NO debes guardar tu perfume en el baño",
    hashtags: ["#perfumes", "#cuidadopersonal", "#shorts"] },
  { id: "s03-3", video: 3, desde: "Y el truco que más dinero te ahorra:", hasta: "solo compras lo que de verdad te queda.", etiqueta: "Compra inteligente con decants, miniaturas y testers",
    gancho: ["PRUEBA PERFUMES", "SIN GASTAR DE MÁS"], titulo: "Decants: prueba perfumes antes de comprar el frasco",
    hashtags: ["#perfumes", "#decants", "#shorts"] },
  // ---- Video 4
  { id: "s04-1", video: 4, desde: "Posponer la alarma.", hasta: "Así no le das tiempo a tu cabeza de negociar.",
    gancho: ["DEJA DE POSPONER", "LA ALARMA"], titulo: "Posponer la alarma te está quitando confianza",
    hashtags: ["#confianza", "#habitos", "#shorts"] },
  { id: "s04-2", video: 4, desde: "Compararte en redes desde temprano.", hasta: "tú contra el tú de hace un mes.",
    gancho: ["ESA COMPARACIÓN", "ESTÁ ARREGLADA"], titulo: "Deja de compararte en redes apenas despiertas",
    hashtags: ["#confianza", "#redessociales", "#shorts"] },
  { id: "s04-3", video: 4, desde: "Y el más grave de todos, el que más gente comete:", hasta: "es lo que construye una confianza de verdad.", etiqueta: "Romper las promesas que te haces a ti mismo",
    gancho: ["LA RAÍZ DE TU", "FALTA DE CONFIANZA"], titulo: "La verdadera razón por la que no confías en ti",
    hashtags: ["#confianza", "#superacionpersonal", "#shorts"] },
  // ---- Video 5
  { id: "s05-1", video: 5, desde: "Conoce tu tipo de piel.", hasta: "te ahorra dinero en productos que no te sirven.",
    gancho: ["¿CUÁL ES TU", "TIPO DE PIEL?"], titulo: "Cómo saber tu tipo de piel (prueba fácil para hombres)",
    hashtags: ["#cuidadodelapiel", "#skincarehombres", "#shorts"] },
  { id: "s05-2", video: 5, desde: "Agua tibia, nunca caliente.", hasta: "solo cambia cómo haces algo que ya haces.",
    gancho: ["DEJA DE LAVARTE", "CON AGUA CALIENTE"], titulo: "El error del agua caliente en tu cara",
    hashtags: ["#cuidadodelapiel", "#skincarehombres", "#shorts"] },
  { id: "s05-3", video: 5, desde: "Bloqueador solar todos los días.", hasta: "en toda la cara, las orejas y el cuello.",
    gancho: ["EL PASO QUE", "CASI TODOS SE SALTAN"], titulo: "El paso de skincare que casi todos los hombres se saltan",
    hashtags: ["#bloqueadorsolar", "#skincarehombres", "#shorts"] },
];

// Calendario PROPUESTO: 1 short por día, alternando videos. Regla: un short sale solo después de
// que su video largo ya esté público (el short termina con "Video completo en el canal").
const ORDEN = ["s02-3", "s03-2", "s04-1", "s05-3", "s02-1", "s03-1", "s04-2", "s05-2", "s02-2", "s03-3", "s04-3", "s05-1"];
const INICIO_CAL = "2026-11-26"; // ejemplo; ajustar a la fecha real

const words = (s) => s.split(/\s+/).filter(Boolean);
const mmss = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;

const textos = {};
for (const v of Object.keys(VIDEOS)) {
  textos[v] = fs.readFileSync(path.join(GUIONES, `video0${v}.txt`), "utf8");
}

function bloqueDe(v, idx, etiqueta) {
  // idx = posición de carácter; devuelve etiqueta del bloque según el párrafo
  const parrafos = textos[v].split(/\n\s*\n/);
  let acc = 0;
  for (let p = 0; p < parrafos.length; p++) {
    const fin = textos[v].indexOf(parrafos[p], acc) + parrafos[p].length;
    if (idx < fin) {
      const primera = parrafos[p].trim().split(/(?<=[.:])\s/)[0];
      if (p === 0) return "Intro";
      if (p === parrafos.length - 1) return "Cierre";
      return `#${VIDEOS[v].puntos - (p - 1)} — ${etiqueta || primera.replace(/[.:]$/, "")}`;
    }
    acc = fin;
  }
  return "?";
}

const plan = [];
for (const s of SPEC) {
  const t = textos[s.video];
  const a = t.indexOf(s.desde);
  if (a < 0 || t.indexOf(s.desde, a + 1) >= 0) throw new Error(`${s.id}: 'desde' no encontrado o repetido`);
  const bRel = t.indexOf(s.hasta, a);
  if (bRel < 0) throw new Error(`${s.id}: 'hasta' no encontrado`);
  const b = bRel + s.hasta.length;
  const texto = t.slice(a, b).trim();
  if (/\n\s*\n/.test(texto)) throw new Error(`${s.id}: el fragmento cruza de párrafo`);
  const total = words(t).length;
  const antes = words(t.slice(0, a)).length;
  const n = words(texto).length;
  const dur = VIDEOS[s.video].dur;
  const ini = (antes / total) * dur;
  const fin = ((antes + n) / total) * dur;
  const d = fin - ini;
  if (d < 35 || d > 55) throw new Error(`${s.id}: duración ${d.toFixed(1)} s fuera de 35–55`);
  for (const l of s.gancho) if (l !== l.toUpperCase() || l.length > 20) throw new Error(`${s.id}: gancho inválido`);
  plan.push({
    id: s.id,
    video: s.video,
    video_titulo: VIDEOS[s.video].titulo,
    bloque: bloqueDe(s.video, a, s.etiqueta),
    texto,
    palabras: n,
    palabras_totales_guion: total,
    audio_total_s: dur,
    inicio_s: +ini.toFixed(1),
    fin_s: +fin.toFixed(1),
    duracion_s: +d.toFixed(1),
    inicio_mmss: mmss(ini),
    fin_mmss: mmss(fin),
    gancho_pantalla: s.gancho,
    titulo_youtube: s.titulo,
    hashtags: s.hashtags,
    cierre_pantalla: "Video completo en el canal",
  });
}

const cal = ORDEN.map((id, i) => {
  const d = new Date(INICIO_CAL + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + i);
  return { dia: i + 1, fecha_propuesta: d.toISOString().slice(0, 10), short: id };
});

const json = {
  _nota:
    "Generado por herramientas/generar-plan.cjs. Tiempos APROXIMADOS (proporción de palabras); ajustar a la pausa más cercana antes de cortar (ver README). Calendario = PROPUESTA.",
  formato: { ancho: 1080, alto: 1920, subtitulos: "Arial Black 100", cierre: "Video completo en el canal" },
  shorts: plan,
  calendario_propuesto: { nota: "PROPUESTA: 1 por día; ningún short antes de que su video largo esté público.", dias: cal },
};
fs.writeFileSync(path.join(SHORTS, "plan-shorts.json"), JSON.stringify(json, null, 2) + "\n");

let md = `# Plan de shorts — videos 2 a 5

> Generado por \`herramientas/generar-plan.cjs\` a partir de \`guiones/originales/videoNN.txt\`.
> El texto de cada short es **copia exacta** de un trozo continuo del guion (la narración ya está grabada).
> Tiempos **aproximados**: inicio/fin = (palabras antes del fragmento / palabras totales) × duración del audio.
> Antes de cortar, ajústalos a la pausa más cercana (ver \`README.md\`). La misma información está en \`plan-shorts.json\`.

Formato: vertical 1080×1920, voz clonada, subtítulos Arial Black 100, cierre "Video completo en el canal".

| Short | Video | Bloque | Inicio → fin | Duración | Gancho |
|---|---|---|---|---|---|
${plan.map((p) => `| ${p.id} | V${p.video} | ${p.bloque} | ${p.inicio_mmss} → ${p.fin_mmss} | ~${Math.round(p.duracion_s)} s | ${p.gancho_pantalla.join(" / ")} |`).join("\n")}

`;
for (const v of Object.keys(VIDEOS)) {
  md += `## Video ${v} — ${VIDEOS[v].titulo}\n\nAudio total: ${VIDEOS[v].dur} s · ${words(textos[v]).length} palabras en el guion.\n\n`;
  for (const p of plan.filter((x) => x.video === +v)) {
    md += `### ${p.id} · ${p.bloque}\n\n`;
    md += `- **Tiempo aprox. en el audio:** ${p.inicio_mmss} → ${p.fin_mmss} (${p.inicio_s} s → ${p.fin_s} s, ~${p.duracion_s} s, ${p.palabras} palabras)\n`;
    md += `- **Gancho en pantalla (2 líneas):** \`${p.gancho_pantalla[0]}\` / \`${p.gancho_pantalla[1]}\`\n`;
    md += `- **Título del short:** ${p.titulo_youtube}\n`;
    md += `- **Hashtags:** ${p.hashtags.join(" ")}\n`;
    md += `- **Texto exacto:**\n\n> ${p.texto}\n\n`;
  }
}
md += `## Calendario sugerido (PROPUESTA)

1 short por día, alternando videos para no repetir tema dos días seguidos. Las fechas son un **ejemplo**
que empieza el ${INICIO_CAL}: recórrelas a la fecha real. Regla: ningún short se publica antes de que su
video largo esté público (todos cierran con "Video completo en el canal"). Nada se publica sin tu aprobación.

| Día | Fecha (ejemplo) | Short | Video | Título |
|---|---|---|---|---|
${cal.map((c) => { const p = plan.find((x) => x.id === c.short); return `| ${c.dia} | ${c.fecha_propuesta} | ${c.short} | V${p.video} | ${p.titulo_youtube} |`; }).join("\n")}
`;
fs.writeFileSync(path.join(SHORTS, "plan-shorts.md"), md);
for (const p of plan) console.log(p.id, p.bloque, p.inicio_mmss, "→", p.fin_mmss, p.duracion_s + "s");

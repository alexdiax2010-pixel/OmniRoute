// Convierte anuncio.html en MP4 vertical (1080x1920, 30 fps) con sonido.
// Uso: node marketing/video/render.cjs [salida.mp4]
const { chromium } = require("playwright");
const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const FPS = 30;
const html = path.join(__dirname, "anuncio.html");
const salida = process.argv[2] || path.join(__dirname, "anuncio-sky-studios.mp4");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "anuncio-"));
const soloVideo = path.join(tmp, "video.mp4");
const eventos = path.join(tmp, "eventos.json");
const audio = path.join(tmp, "audio.wav");

(async () => {
  const navegador = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
  await pagina.goto("file://" + html + "#render");
  const duracion = await pagina.evaluate(() => window.LISTO);
  const info = await pagina.evaluate(() => ({ sonidos: window.SONIDOS, cortes: window.CORTES }));
  fs.writeFileSync(eventos, JSON.stringify({ duracion, ...info }));
  const total = Math.ceil(duracion * FPS);

  const ffmpeg = spawn("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", soloVideo,
  ], { stdio: ["pipe", "inherit", "inherit"] });

  for (let f = 0; f < total; f++) {
    await pagina.evaluate((t) => window.irA(t), f / FPS);
    const cuadro = await pagina.screenshot({ type: "jpeg", quality: 92 });
    if (!ffmpeg.stdin.write(cuadro)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
    if (f % 90 === 0) process.stdout.write(`cuadro ${f}/${total}\n`);
  }
  ffmpeg.stdin.end();
  await new Promise((r) => ffmpeg.on("close", r));
  await navegador.close();

  execFileSync("python3", [path.join(__dirname, "sonido.py"), eventos, audio], { stdio: "inherit" });
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", soloVideo, "-i", audio, "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", salida], { stdio: "inherit" });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("Listo:", salida);
})();

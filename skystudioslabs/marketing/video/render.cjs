// Convierte anuncio.html en MP4 vertical (1080x1920, 30 fps) cuadro por cuadro.
// Uso: node marketing/video/render.cjs [salida.mp4]
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");

const FPS = 30;
const html = path.join(__dirname, "anuncio.html");
const salida = process.argv[2] || path.join(__dirname, "anuncio-sky-studios.mp4");

(async () => {
  const navegador = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
  await pagina.goto("file://" + html + "#render");
  const duracion = await pagina.evaluate(() => window.LISTO);
  const total = Math.ceil(duracion * FPS);

  const ffmpeg = spawn("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", salida,
  ], { stdio: ["pipe", "inherit", "inherit"] });

  for (let f = 0; f < total; f++) {
    await pagina.evaluate((t) => window.irA(t), f / FPS);
    const cuadro = await pagina.screenshot({ type: "jpeg", quality: 92 });
    if (!ffmpeg.stdin.write(cuadro)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
    if (f % 60 === 0) process.stdout.write(`cuadro ${f}/${total}\n`);
  }
  ffmpeg.stdin.end();
  await new Promise((r) => ffmpeg.on("close", r));
  await navegador.close();
  console.log("Listo:", salida);
})();

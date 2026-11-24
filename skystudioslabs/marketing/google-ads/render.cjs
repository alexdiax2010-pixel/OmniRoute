// Exporta cada lienzo de imagenes.html a JPG (fotos) y PNG (logos) para Google Ads.
const { chromium } = require("playwright");
const path = require("node:path");
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  await p.goto("file://" + path.join(__dirname, "imagenes.html"));
  await p.evaluate(() => document.fonts.ready);
  for (const [id, ext] of [["horizontal","jpg"],["cuadrada","jpg"],["vertical","jpg"],["logo-cuadrado","png"],["logo-horizontal","png"]]) {
    const out = path.join(__dirname, `${id}.${ext}`);
    await p.locator("#" + id).screenshot({ path: out, type: ext === "jpg" ? "jpeg" : "png", ...(ext === "jpg" ? { quality: 90 } : {}) });
    console.log(out);
  }
  await b.close();
})();

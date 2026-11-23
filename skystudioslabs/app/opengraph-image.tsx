import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Excepción de tipografía: la imagen se renderiza con Satori, fuera del CSS del sitio.
export const alt = "Sky Studios Labs — Páginas que venden, en todo México";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function cargarAnton(): Promise<ArrayBuffer | Buffer | null> {
  try {
    return await readFile(join(process.cwd(), "node_modules/@fontsource/anton/files/anton-latin-400-normal.woff"));
  } catch {
    return null;
  }
}

export default async function Image() {
  const anton = await cargarAnton();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "72px 80px",
          background: "#050505",
          color: "#f4f1ec",
          position: "relative",
          fontFamily: anton ? "Anton" : "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1200,
            height: 630,
            background:
              "radial-gradient(circle at 910px 150px, rgba(255,74,28,0.7) 0%, rgba(255,138,42,0.22) 260px, rgba(5,5,5,0) 460px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 160,
            top: 50,
            width: 260,
            height: 130,
            borderTopLeftRadius: 130,
            borderTopRightRadius: 130,
            background: "linear-gradient(135deg, #ff8a2a, #ff4a1c)",
          }}
        />
        <div style={{ position: "absolute", right: 120, top: 186, width: 340, height: 10, borderRadius: 5, background: "#f4f1ec" }} />
        <div style={{ display: "flex", fontSize: 150, lineHeight: 0.9, textTransform: "uppercase", letterSpacing: -1 }}>
          SKY STUDIOS LABS
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 64, textTransform: "uppercase" }}>
          <span style={{ color: "#ff6a24" }}>Páginas que venden</span>
        </div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 30, color: "#a8a39b", fontFamily: "sans-serif" }}>
          Todo México · Boceto gratis
        </div>
      </div>
    ),
    {
      ...size,
      fonts: anton ? [{ name: "Anton", data: anton, style: "normal", weight: 400 }] : undefined,
    }
  );
}

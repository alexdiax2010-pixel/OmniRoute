import type { Metadata, Viewport } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITIO } from "@/config/sitio";
import { webSite } from "@/lib/seo/schema";
import { IMAGEN_OG, siteUrl } from "@/lib/seo/url";
import { display, sans } from "./fonts";
import "./globals.css";

const TITULO = "Sky Studios Labs — Páginas web para negocios en México";
const DESCRIPCION =
  "Páginas web, Google Maps, redes sociales y chatbots para negocios de todo México. Pide tu boceto gratis.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: SITIO.nombre,
  title: { default: TITULO, template: "%s | Sky Studios Labs" },
  description: DESCRIPCION,
  // Valores por defecto para cualquier página que no defina los suyos.
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: SITIO.nombre,
    title: TITULO,
    description: DESCRIPCION,
    images: [IMAGEN_OG],
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRIPCION, images: [IMAGEN_OG.url] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${display.variable} ${sans.variable}`}>
      <body>
        <JsonLd data={webSite()} />
        {children}
      </body>
    </html>
  );
}

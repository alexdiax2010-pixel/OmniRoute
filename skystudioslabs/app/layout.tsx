import type { Metadata, Viewport } from "next";
import { display, sans } from "./fonts";
import { siteUrl } from "@/lib/seo/url";
import "./globals.css";

/**
 * Códigos de verificación de Google Search Console y Bing Webmaster Tools (no son secretos).
 * Se configuran en Vercel: GOOGLE_SITE_VERIFICATION y BING_SITE_VERIFICATION.
 */
function verificacion(): Metadata["verification"] {
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const bing = process.env.BING_SITE_VERIFICATION?.trim();
  if (!google && !bing) return undefined;
  return { ...(google ? { google } : {}), ...(bing ? { other: { "msvalidate.01": bing } } : {}) };
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: "Sky Studios Labs",
  title: { default: "Sky Studios Labs — Páginas web para negocios en México", template: "%s | Sky Studios Labs" },
  description:
    "Páginas web, Google Maps, redes sociales y chatbots para negocios de todo México. Pide tu boceto gratis.",
  verification: verificacion(),
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}

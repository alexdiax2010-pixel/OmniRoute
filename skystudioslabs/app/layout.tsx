import type { Metadata, Viewport } from "next";
import { display, sans } from "./fonts";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skystudioslabs.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Sky Studios Labs — Páginas web para negocios en Zapopan", template: "%s | Sky Studios Labs" },
  description:
    "Páginas web, Google Maps, redes sociales y chatbots para negocios locales de Zapopan y Guadalajara. Pide tu boceto gratis.",
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

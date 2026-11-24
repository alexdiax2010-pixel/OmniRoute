import type { Metadata, Viewport } from "next";
import { display, sans } from "./fonts";
import { siteUrl } from "@/lib/seo/url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: "Sky Studios Labs",
  title: { default: "Sky Studios Labs — Páginas web para negocios en México", template: "%s | Sky Studios Labs" },
  description:
    "Páginas web, Google Maps, redes sociales y chatbots para negocios de todo México. Pide tu boceto gratis.",
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

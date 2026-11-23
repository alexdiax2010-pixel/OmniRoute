import type { Metadata } from "next";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { WhatsAppFab } from "@/components/chrome/WhatsAppFab";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITIO } from "@/config/sitio";
import { professionalService } from "@/lib/seo/schema";
import { IMAGEN_OG } from "@/lib/seo/url";

const DESCRIPCION =
  "Páginas web, Google Maps, redes sociales y chatbots de WhatsApp para negocios de todo México. Pide tu boceto gratis.";

export const metadata: Metadata = {
  description: DESCRIPCION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: SITIO.nombre,
    url: "/",
    title: "Sky Studios Labs — Páginas web para negocios en México",
    description: DESCRIPCION,
    images: [IMAGEN_OG],
  },
  twitter: { card: "summary_large_image" },
};

export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={professionalService()} />
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}

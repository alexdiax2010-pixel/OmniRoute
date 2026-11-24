import type { Metadata } from "next";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { WhatsAppFab } from "@/components/chrome/WhatsAppFab";
import { JsonLd } from "@/components/seo/JsonLd";
import { alternatesPara, compartirPara, INICIO } from "@/lib/seo/metadata";
import { professionalService, webSite } from "@/lib/seo/schema";

// Valores por defecto = portada. Las páginas SEO los reemplazan con metadataSEO().
// OG/Twitter usan el mismo título y descripción que la portada (antes no coincidían).
export const metadata: Metadata = {
  description: INICIO.descripcion,
  alternates: alternatesPara("/"),
  ...compartirPara("/", INICIO.titulo, INICIO.descripcion),
};

export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={professionalService()} />
      <JsonLd data={webSite()} />
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

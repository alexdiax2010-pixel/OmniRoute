import type { Metadata, Viewport } from "next";
import s from "./admin.module.css";

export const metadata: Metadata = {
  title: { default: "CRM", template: "%s · CRM Sky" },
  robots: { index: false, follow: false },
  // Se puede instalar en el teléfono (necesario en iPhone para recibir avisos).
  manifest: "/crm.webmanifest",
  appleWebApp: { capable: true, title: "CRM Sky", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

/** Barra del navegador con el color del CRM (claro/oscuro) y soporte para la muesca del iPhone. */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#151f1d" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Envoltura visual del CRM. La autorización vive en (crm)/layout.tsx y en cada Server Action. */
export default function AdminRaiz({ children }: { children: React.ReactNode }) {
  return <div className={s.shell}>{children}</div>;
}

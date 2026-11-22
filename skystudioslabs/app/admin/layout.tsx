import type { Metadata } from "next";
import s from "./admin.module.css";

export const metadata: Metadata = {
  title: { default: "CRM", template: "%s · CRM Sky" },
  robots: { index: false, follow: false },
  // Se puede instalar en el teléfono (necesario en iPhone para recibir avisos).
  manifest: "/crm.webmanifest",
  appleWebApp: { capable: true, title: "CRM Sky", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

/** Envoltura visual del CRM. La autorización vive en (crm)/layout.tsx y en cada Server Action. */
export default function AdminRaiz({ children }: { children: React.ReactNode }) {
  return <div className={s.shell}>{children}</div>;
}

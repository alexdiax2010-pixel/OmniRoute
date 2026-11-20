import type { Metadata } from "next";
import s from "./admin.module.css";

export const metadata: Metadata = {
  title: { default: "CRM", template: "%s · CRM Sky" },
  robots: { index: false, follow: false },
};

/** Envoltura visual del CRM. La autorización vive en (crm)/layout.tsx y en cada Server Action. */
export default function AdminRaiz({ children }: { children: React.ReactNode }) {
  return <div className={s.shell}>{children}</div>;
}

import type { Metadata } from "next";
import s from "./portal.module.css";

export const metadata: Metadata = {
  title: { default: "Mi portal", template: "%s · Portal Sky" },
  robots: { index: false, follow: false },
};

export default function PortalRaiz({ children }: { children: React.ReactNode }) {
  return <div className={s.shell}>{children}</div>;
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  etiqueta: ReactNode;
  children: ReactNode;
  className?: string;
  summaryClassName?: string;
  panelClassName?: string;
};

/**
 * <details> accesible para menús: funciona sin JS; con JS se cierra al navegar,
 * al elegir un enlace, al hacer clic fuera o con Escape.
 */
export function NavDetails({ etiqueta, children, className, summaryClassName, panelClassName }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      const el = ref.current;
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      const el = ref.current;
      if (e.key === "Escape" && el?.open) {
        el.open = false;
        el.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details
      ref={ref}
      className={className}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a") && ref.current) ref.current.open = false;
      }}
    >
      <summary className={summaryClassName}>{etiqueta}</summary>
      <div className={panelClassName}>{children}</div>
    </details>
  );
}

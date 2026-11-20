import localFont from "next/font/local";

/** Display: Anton — condensada y muy gruesa; aguanta 168px sin perder carácter. */
export const display = localFont({
  src: "../node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "400",
});

/** Texto: Inter — muy legible a 18px y con excelente soporte de acentos y ñ. */
export const sans = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
});

/**
 * CSV seguro para Excel/Sheets. Evita inyección de fórmulas: una celda que empieza con
 * = + - @ (o tab / retorno) se antepone con un apóstrofo.
 */
export function celdaCSV(valor: unknown): string {
  let s = valor == null ? "" : Array.isArray(valor) ? valor.join("; ") : typeof valor === "object" ? JSON.stringify(valor) : String(valor);
  // También con espacios delante (" =1+1") y con los signos de ancho completo (＝＋－＠),
  // que algunas versiones de Excel convierten en fórmula.
  if (/^[\s\u00a0]*[=+\-@\uff1d\uff0b\uff0d\uff20]/.test(s) || /^[\t\r\n]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function aCSV(encabezados: string[], filas: unknown[][]): string {
  const lineas = [encabezados, ...filas].map((f) => f.map(celdaCSV).join(","));
  return `﻿${lineas.join("\r\n")}\r\n`;
}

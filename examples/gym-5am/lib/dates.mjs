// Fechas como texto YYYY-MM-DD en la zona horaria del servidor (configurable con la variable TZ).

const pad = (n) => String(n).padStart(2, "0");

export const todayStr = (now = new Date()) =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const parse = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
};

const fmt = (date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

export const isDateStr = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const { y, m, d } = parse(s);
  return fmt(new Date(Date.UTC(y, m - 1, d))) === s;
};

export const addDays = (s, n) => {
  const { y, m, d } = parse(s);
  return fmt(new Date(Date.UTC(y, m - 1, d + n)));
};

// Suma meses de calendario; si el día no existe en el mes destino, usa el último día (31 ene + 1 → 28/29 feb).
export const addMonths = (s, n) => {
  const { y, m, d } = parse(s);
  const lastDay = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  return fmt(new Date(Date.UTC(y, m - 1 + n, Math.min(d, lastDay))));
};

export const daysBetween = (from, to) => {
  const a = parse(from);
  const b = parse(to);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
};

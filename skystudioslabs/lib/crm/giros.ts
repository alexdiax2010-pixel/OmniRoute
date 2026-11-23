import { plano } from "./texto";

/**
 * Normalización de giros y categorías al importar (pura).
 * Las listas de prospección traen el mismo giro escrito de muchas formas ("Dentista",
 * "Consultorio dental", "Clínica dental en Zapopan"…). Aquí se agrupan en un nombre canónico
 * para poder filtrar y contar; el texto original no se pierde (crm:importar lo deja en una nota).
 */

/** Orden importa: la primera regla que coincide gana ("Estética y barbería" → Barbería). */
const REGLAS: { giro: string; patron: RegExp }[] = [
  { giro: "Dentista", patron: /dental|dentist|odont|ortodon|endodon|cirugia oral/ },
  { giro: "Hojalatería y pintura", patron: /hojalateria|laminado|pintura automotriz/ },
  {
    giro: "Taller mecánico",
    patron: /taller mecanico|mecanica|electromecanic|transmision|diesel|frenos|chicotes|radiador|aire acondicionado automotriz|afinacion/,
  },
  { giro: "Autolavado", patron: /autolavado|auto lavado|auto bano|lavado de autos/ },
  { giro: "Barbería", patron: /barber/ },
  { giro: "Fisioterapia", patron: /fisioterap|rehabilitacion|quiroprac|traumatolog/ },
  { giro: "Veterinaria", patron: /veterinar/ },
  { giro: "Psicología", patron: /psicolog|salud mental/ },
  { giro: "Abogados", patron: /abogad|juridic|notaria/ },
  { giro: "Contador", patron: /contador|contable|fiscal/ },
  { giro: "Banquetes", patron: /catering|banquete/ },
  { giro: "Cafetería", patron: /cafeteria|^cafe\b|cafe de especialidad/ },
  { giro: "Panadería", patron: /panaderia|reposteria|pasteleria/ },
  { giro: "Restaurante", patron: /restaurante|taqueria|fonda|tortas|comida/ },
  { giro: "Guardería", patron: /guarderia|cuidado infantil|estancia infantil/ },
  { giro: "Educación", patron: /educacion|escuela|idiomas|colegio/ },
  { giro: "Uñas", patron: /unas|nails/ },
  { giro: "Clínica estética", patron: /clinica estetica|cuidado de la piel|cosmetolog/ },
  { giro: "Spa", patron: /\bspa\b/ },
  { giro: "Gimnasio", patron: /gimnasio|crossfit|gym/ },
  { giro: "Bienes raíces", patron: /bienes raices|inmobiliari/ },
  { giro: "Tatuajes", patron: /tatuaje|tattoo/ },
];

function capitalizar(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t ? t[0].toLocaleUpperCase("es-MX") + t.slice(1) : "";
}

/** Giros que en realidad son categorías ("salud", "automotriz"): se intenta deducir del nombre. */
const GENERICOS = new Set(["salud", "automotriz", "servicios", "servicios profesionales", "oficios", "comida", "belleza"]);

const porRegla = (texto: string) => REGLAS.find((r) => r.patron.test(plano(texto)))?.giro ?? null;

/**
 * Giro canónico. Si no hay regla, el texto limpio con mayúscula inicial y sin " en <lugar>".
 * Si el giro es genérico ("salud") y el NOMBRE del negocio lo deja claro ("Dental City"), usa ese.
 */
export function normalizarGiro(giro: string, nombre = ""): string {
  const t = (giro ?? "").trim();
  if (!t) return nombre ? (porRegla(nombre) ?? "") : "";
  const regla = porRegla(t);
  if (regla) return regla;
  if (GENERICOS.has(plano(t)) && nombre) {
    const deNombre = porRegla(nombre);
    if (deNombre) return deNombre;
  }
  return capitalizar(t.replace(/\s+en\s+[^/]+$/i, "").replace(/\s*\([^)]*\)\s*$/, ""));
}

const CATEGORIAS = ["Salud", "Automotriz", "Servicios", "Comida", "Belleza", "Educación"];
const CATEGORIA_POR_CLAVE = new Map(CATEGORIAS.map((c) => [plano(c), c]));

/** "salud" / "SALUD" → "Salud". Desconocida: mayúscula inicial. */
export function normalizarCategoria(cat: string): string {
  const t = (cat ?? "").trim();
  if (!t) return "";
  return CATEGORIA_POR_CLAVE.get(plano(t)) ?? capitalizar(t);
}

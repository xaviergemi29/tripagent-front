/**
 * @description Genera las iniciales de un nombre completo para usar en avatares de UI.
 * Toma la primera letra de las dos primeras palabras. Si solo hay una palabra, toma las dos primeras letras.
 *
 * @param {string} name - Nombre completo del viajero (ej. "José Xavier Ramos").
 * @returns {string} Iniciales en mayúscula (ej. "JX"). Retorna "VI" por defecto si no hay nombre.
 */
export function getInitials(name: string): string {
  if (!name) return "VI";

  // Limpiamos espacios extra y filtramos strings vacíos
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() || "VI";
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/50",
  "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/50",
  "bg-purple-100 text-purple-700 ring-1 ring-purple-200/50",
  "bg-amber-100 text-amber-800 ring-1 ring-amber-200/50",
  "bg-blue-100 text-blue-700 ring-1 ring-blue-200/50",
  "bg-teal-100 text-teal-700 ring-1 ring-teal-200/50",
];

/**
 * @description Asigna un color determinístico (siempre el mismo color para el mismo nombre)
 * basado en un algoritmo de hashing de strings. Ideal para generar avatares sin almacenar el color en DB.
 *
 * @param {string} name - String a evaluar (generalmente el nombre del usuario).
 * @returns {string} Clases de Tailwind CSS correspondientes al color asignado.
 */
export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];

  let hash = 0;
  // Algoritmo de hashing simple (DJB2 adaptado):
  // Desplazamiento de bits (Bitwise shift) para generar un identificador numérico único basado en los caracteres
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Operación módulo para asegurar que el índice caiga dentro del array de colores
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

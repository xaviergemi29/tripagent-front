/**
 * @description Calcula la edad exacta en años a partir de una fecha de nacimiento.
 * Maneja automáticamente años bisiestos y compensa si el cumpleaños de este año aún no ha ocurrido.
 *
 * @param {string | null | undefined} birthDateString - Fecha de nacimiento (ej. "1992-05-29" o ISO string).
 * @returns {number | null} La edad en años enteros, o `null` si la entrada es nula o inválida.
 *
 * @example
 * calculateAge("1990-01-01") // 36 (dependiendo del año actual)
 * calculateAge(null) // null
 */
export const calculateAge = (birthDateString?: string | null): number | null => {
  if (!birthDateString) return null;
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  // Diferencia de meses para saber si ya pasó su cumpleaños este año
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Si el mes actual es anterior al mes de nacimiento,
  // o si es el mismo mes pero el día actual es anterior al día de nacimiento, restamos 1 año.
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Formatea una fecha a YYYY-MM-DD para compatibilidad estricta con <input type="date" />
 */
export const formatForDateInput = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return "";

  // Si es un ISO String corto (ej: "2026-10-23T15:00:00.000Z"), extraemos rápido YYYY-MM-DD
  if (typeof dateInput === "string") {
    // Maneja casos donde el string no sea una fecha válida antes de recortar
    if (dateInput.length >= 10 && !isNaN(Date.parse(dateInput))) {
      return dateInput.slice(0, 10);
    }
  }

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  // Validación contra Invalid Date
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

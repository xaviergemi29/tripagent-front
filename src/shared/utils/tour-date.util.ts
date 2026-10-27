/**
 * @description Formatea una fecha u objeto Date a YYYY-MM-DD para compatibilidad estricta con <input type="date" />.
 * @param {string | Date | undefined | null} dateInput - Fecha en formato ISO o instancia Date.
 * @returns {string} Fecha en formato "YYYY-MM-DD". Devuelve string vacío si es inválido.
 * @example
 * formatForDateInput(new Date("2026-10-23T15:00:00.000Z")) // "2026-10-23"
 * formatForDateInput("2026-10-23T15:00:00Z") // "2026-10-23"
 */
export const formatForDateInput = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return "";

  if (typeof dateInput === "string") {
    if (dateInput.length >= 10 && !isNaN(Date.parse(dateInput))) {
      return dateInput.slice(0, 10);
    }
  }

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * @description Parsea una fecha "YYYY-MM-DD" y la formatea a un string corto en español de México.
 * El split manual evita que el motor JS aplique el offset de la zona horaria local y desvíe el día.
 * @param {string} departureDateTime - Fecha en formato "YYYY-MM-DD".
 * @returns {string} Fecha formateada corta.
 * @example
 * formatLocalDate("2026-09-21") // "sáb., 21 sept." (dependiendo del navegador)
 */
export const formatLocalDate = (departureDateTime: string): string => {
  if (!departureDateTime) return "";
  const [year, month, day] = departureDateTime.split("-").map(Number);
  if (!year || !month || !day) return departureDateTime;

  const localDate = new Date(year, month - 1, day);

  const formatted = new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(localDate);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

/**
 * @description Parsea una fecha "YYYY-MM-DD" y la formatea a un string largo en español con mayúscula inicial.
 * @param {string | null | undefined} dateString - Fecha en formato "YYYY-MM-DD".
 * @returns {string} Fecha formateada larga.
 * @example
 * formatSpanishLongDate("2026-10-23") // "Viernes, 23 de octubre"
 */
export const formatSpanishLongDate = (dateString?: string | null): string => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return dateString;

  const date = new Date(year, month - 1, day);

  const formatter = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const formatted = formatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

/**
 * @description Convierte una hora en formato militar (24h) a formato estándar de 12h (AM/PM).
 * @param {string | null | undefined} timeStr - Hora en formato "HH:mm" (ej. "15:30").
 * @returns {string} Hora formateada (ej. "03:30 PM"). Si es nulo o inválido, devuelve "--:--".
 * @example
 * formatPickupTime("15:30") // "03:30 PM"
 * formatPickupTime("06:00") // "06:00 AM"
 */
export const formatPickupTime = (timeStr?: string | null): string => {
  if (!timeStr) return "--:--";
  if (/am|pm/i.test(timeStr)) return timeStr.toUpperCase();

  const [hoursStr, minutesStr] = timeStr.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr ? minutesStr.slice(0, 2) : "00";

  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Transforma 0 y 12 a 12
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;

  return `${formattedHours}:${minutes} ${ampm}`;
};

/**
 * @description Combina el formateador de fecha larga y hora de abordaje para generar el string completo del Tour.
 * @param {string} dateString - Fecha en formato "YYYY-MM-DD".
 * @param {Array<{ time?: string }>} [boardingPoints] - Arreglo de puntos de abordaje de la base de datos.
 * @returns {string} String compuesto.
 * @example
 * formatTourDateTime("2026-10-23", [{ time: "15:30" }]) // "Viernes, 23 de octubre • 03:30 PM"
 */
export const formatTourDateTime = (
  dateString?: string | null,
  boardingPoints?: any[] | null,
): string => {
  if (!dateString) return "";
  const baseDate = formatSpanishLongDate(dateString);

  if (boardingPoints && boardingPoints.length > 0 && boardingPoints[0].time) {
    return `${baseDate} • ${formatPickupTime(boardingPoints[0].time)}`;
  }

  return baseDate;
};

/**
 * Formatea un timestamp a fecha y hora corta. Ej: "sáb., 21 sept. 15:30"
 */
export const formatShortDateTime = (dateString: string): string => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Devuelve la fecha actual en formato YYYY-MM-DD para nombres de archivos o inputs.
 */
export const getTodayIsoString = (): string => {
  return new Date().toISOString().split("T")[0];
};

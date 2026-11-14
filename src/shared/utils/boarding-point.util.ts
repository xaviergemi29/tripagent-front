const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface BoardingPointDisplay {
  location: string;
  time: string | null;
}

/**
 * @description Punto de abordaje que se muestra al viajero: el configurado en el tour
 * (`boardingPointDetails`, resuelto por la API con la misma regla del manifiesto) o, si no
 * coincide con ninguno, el texto guardado. Nunca devuelve identificadores técnicos (UUID).
 * La usan el pase de abordaje (`PaidBookingView`) y el comprobante PDF.
 */
export const resolveBoardingPointDisplay = (passenger: {
  boardingPoint?: string | null;
  boardingPointDetails?: { location: string; time: string | null } | null;
}): BoardingPointDisplay | null => {
  if (passenger.boardingPointDetails) return passenger.boardingPointDetails;
  const raw = passenger.boardingPoint?.trim();
  if (!raw || UUID_REGEX.test(raw)) return null;
  return { location: raw, time: null };
};

import { PASSENGER_STATUS } from "@/shared/constants/domain.constants";

/**
 * @description Pasajeros vigentes del Magic Link con el titular primero. Defensa en el front: la
 * API ya envía solo pasajeros activos, pero si un payload trae `status`, se excluye todo lo que no
 * sea `ACTIVE` (p. ej. un acompañante dado de baja). Sin `status` el pasajero se conserva.
 * Única regla para el registro confirmado, el estado de cuenta (pantalla y PDF) y el pase de abordaje.
 */
export const getActivePassengersTitularFirst = <
  T extends { status?: string | null; isTitular?: boolean | null },
>(
  passengers: readonly T[],
): T[] =>
  passengers
    .filter((p) => p.status == null || p.status === PASSENGER_STATUS.ACTIVE)
    .sort((a, b) => Number(Boolean(b.isTitular)) - Number(Boolean(a.isTitular)));

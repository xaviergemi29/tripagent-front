import { PASSENGER_TYPE, type PassengerType } from "@/shared/constants/domain.constants";

export const STAFF_PASSENGER_TYPE_LABEL: Record<PassengerType, string> = {
  [PASSENGER_TYPE.ADULT]: "Adulto",
  [PASSENGER_TYPE.CHILD]: "Niño",
};

export const STAFF_SEAT_RIGHT_LABEL = {
  CONFIRMED: "Confirmado",
  PENDING_DEPOSIT: "Pendiente de anticipo",
} as const;

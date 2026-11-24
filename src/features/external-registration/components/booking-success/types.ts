import type { Currency, PassengerStatus } from "@/shared/constants/domain.constants";

export interface PassengerDTO {
  name: string;
  isTitular: boolean;
  boardingPoint: string | null;
  /** `passenger_status`; la API envía solo activos, el front filtra por defensa si llega. */
  status?: PassengerStatus;
}

export interface BookingSuccessViewProps {
  booking: {
    bookingId: string;
    agencyName: string;
    agencyPhone: string;
    titularName?: string;
    companionNames?: string[];
    passengers?: PassengerDTO[];
    totalAmount: number;
    depositAmount: number | null;
    acceptsBankTransfer: boolean;
    bankName: string | null;
    accountHolder: string | null;
    clabeNumber: string | null;
    cardNumber?: string | null;
    acceptsCreditCard: boolean;
    acceptsCash: boolean;
    cashInstructions: string | null;
    /** Algún pasajero activo es Niño o menor de 18 (aviso del Art. 58, fr. X Ter, LGT). */
    hasMinors?: boolean;
  };
  tourInfo: { title: string; departureDateTime: string; currency?: Currency };
  titularName: string;
  agencyLogoPath?: string | null;
}

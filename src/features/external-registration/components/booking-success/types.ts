import type { Currency, PassengerStatus } from "@/shared/constants/domain.constants";
import type { PublicBankAccountOutput } from "@/shared/schemas/bank-account.schema";

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
    /** Cuentas de la agencia, en orden. La API no valida el payload: puede faltar. */
    bankAccounts?: PublicBankAccountOutput[];
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

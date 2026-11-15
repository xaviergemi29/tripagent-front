import type { Currency } from "@/shared/constants/domain.constants";

export interface PassengerDTO {
  name: string;
  isTitular: boolean;
  boardingPoint: string | null;
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
    paymentLink: string | null;
    acceptsCash: boolean;
    cashInstructions: string | null;
  };
  tourInfo: { title: string; departureDateTime: string; currency?: Currency };
  titularName: string;
  agencyLogoPath?: string | null;
}

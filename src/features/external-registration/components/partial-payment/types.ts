import type { Currency } from "@/shared/constants/domain.constants";

/** Payload del Magic Link en PARTIAL_PAYMENT (`GET /magic-tokens/:token/validate`). */
export interface PartialPaymentViewProps {
  bookingId: string;
  tourInfo: {
    title: string;
    departureDateTime: string;
    returnDate?: string | null;
    currency?: Currency;
    postPaymentInstructions?: string | null;
  };
  /** Lugares apartados (tamaño esperado del grupo); el PDF muestra cuántos faltan por registrar. */
  groupSize?: number;
  financials: {
    totalAmount: number;
    amountPaid: number;
    remainingBalance: number;
    status: string;
  };
  paymentHistory: {
    id: string;
    date: string;
    amount: number;
    method: string;
    reference?: string | null;
  }[];
  passengers: {
    name: string;
    type: string;
    boardingPoint?: string | null;
    departureTime?: string;
    pickupReference?: string;
    isTitular?: boolean;
    status?: string;
    boardingPointDetails?: { location: string; time: string | null } | null;
    seatLabel?: string | null;
    phone?: string | null;
  }[];
  agency: {
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    bankName: string | null;
    accountHolder: string | null;
    clabeNumber: string | null;
    cardNumber?: string | null;
    logoPath?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
    policies?: string | null;
  };
  token?: string;
  bookingStatus?: string;
  agencyLogoPath?: string | null;
}

export type PartialPaymentPassenger = PartialPaymentViewProps["passengers"][number];
export type PartialPaymentRecord = PartialPaymentViewProps["paymentHistory"][number];

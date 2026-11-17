import {
  type Currency,
  DEFAULT_CURRENCY,
  PASSENGER_STATUS,
} from "@/shared/constants/domain.constants";
import { resolveBoardingPointDisplay } from "@/shared/utils/boarding-point.util";
import { buildApiPublicFileUrl } from "@/shared/utils/share-links.util";
import {
  buildStatementPayments,
  type StatementPDFData,
} from "@/features/statements/pdf/payment-receipt.pdf";

/**
 * Lo que el estado de cuenta necesita del payload del Magic Link
 * (`GET /magic-tokens/:token/validate`, flowState PARTIAL_PAYMENT y PAID comparten la forma).
 */
export interface MagicLinkStatementSource {
  tourInfo: {
    title: string;
    departureDateTime: string;
    returnDate?: string | null;
    currency?: Currency;
    /** Indicaciones de logística del tour (Instrucciones Post-Pago). */
    postPaymentInstructions?: string | null;
  };
  /** Lugares apartados (tamaño esperado del grupo). */
  groupSize?: number;
  financials: { totalAmount: number; amountPaid: number; remainingBalance: number };
  /** Ya viene sin anulaciones (la API filtra los abonos válidos). */
  paymentHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    reference?: string | null;
  }>;
  passengers: Array<{
    name: string;
    isTitular?: boolean;
    status?: string;
    seatLabel?: string | null;
    phone?: string | null;
    boardingPoint?: string | null;
    boardingPointDetails?: { location: string; time: string | null } | null;
  }>;
  agency: {
    name: string;
    phone?: string | null;
    email?: string | null;
    bankName?: string | null;
    accountHolder?: string | null;
    clabeNumber?: string | null;
    logoPath?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
    /** Políticas generales de la agencia. */
    policies?: string | null;
  };
}

/**
 * Convierte el payload del Magic Link al contrato del PDF. Única implementación para las vistas
 * del cliente (`PartialPaymentView` y `PaidBookingView`): pasajeros activos con el titular primero,
 * abordaje resuelto con la regla del pase de abordaje y abonos en orden cronológico.
 */
export function buildMagicLinkStatement(source: MagicLinkStatementSource): StatementPDFData {
  const { tourInfo, financials, agency } = source;
  const activePassengers = source.passengers
    .filter((p) => p.status !== PASSENGER_STATUS.CANCELLED)
    .sort((a, b) => Number(Boolean(b.isTitular)) - Number(Boolean(a.isTitular)));
  // Sin número de tarjeta (decisión del PM): el PDF solo lleva banco, titular y CLABE.
  const hasBankInfo = Boolean(agency.bankName || agency.clabeNumber);

  return {
    agency: {
      name: agency.name || "Agencia de Viajes",
      email: agency.email ?? "",
      whatsapp: agency.phone ?? "",
      logoUrl: agency.logoPath ? buildApiPublicFileUrl(agency.logoPath) : null,
      primaryColor: agency.primaryColor ?? null,
      secondaryColor: agency.secondaryColor ?? null,
      accentColor: agency.accentColor ?? null,
      bankInfo: hasBankInfo
        ? {
            bankName: agency.bankName ?? "",
            accountHolder: agency.accountHolder ?? "",
            clabe: agency.clabeNumber ?? "",
          }
        : null,
      policies: agency.policies ?? null,
    },
    tour: {
      title: tourInfo.title || "Tour",
      departureDate: tourInfo.departureDateTime,
      returnDate: tourInfo.returnDate ?? null,
      totalPassengers: source.groupSize ?? activePassengers.length,
      registeredPassengers: activePassengers.length,
      postPaymentInstructions: tourInfo.postPaymentInstructions ?? null,
    },
    passengers: activePassengers.map((p) => {
      const point = resolveBoardingPointDisplay(p);
      return {
        fullName: p.name,
        isMainPassenger: Boolean(p.isTitular),
        pickupPointName: point?.location ?? "Por coordinar",
        pickupTime: point?.time ?? null,
        seatNumber: p.seatLabel ?? null,
        phone: p.phone ?? null,
      };
    }),
    financials: {
      currency: tourInfo.currency || DEFAULT_CURRENCY,
      totalAmount: financials.totalAmount || 0,
      paidAmount: financials.amountPaid || 0,
      balanceDue: Math.max(0, financials.remainingBalance || 0),
      payments: buildStatementPayments(source.paymentHistory ?? []),
    },
  };
}

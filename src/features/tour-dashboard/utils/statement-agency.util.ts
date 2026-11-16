import type { AgencyOutput } from "@/features/settings/schemas/agency.schema";
import type { AgencyBrandingOutput } from "@/features/settings/schemas/branding.schema";
import {
  buildStatementPayments,
  generatePartialPaymentReceiptPDF,
  type StatementPDFData,
} from "@/features/statements/pdf/payment-receipt.pdf";
import type { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import { buildApiPublicFileUrl } from "@/shared/utils/share-links.util";
import { resolveBoardingPointDisplay } from "@/shared/utils/boarding-point.util";
import {
  type Currency,
  DEFAULT_CURRENCY,
  PASSENGER_ROLE,
  type PassengerRole,
} from "@/shared/constants/domain.constants";
import { toast } from "sonner";

/**
 * Datos de la agencia para el estado de cuenta PDF que descarga el operador desde el Centro de
 * Control (equivalente a `buildMagicLinkStatement` en el portal del cliente). Sin número de
 * tarjeta: el PDF solo lleva banco, titular y CLABE (decisión del PM, regla 16).
 */
export function buildOperatorStatementAgency(
  agency: AgencyOutput | undefined,
  branding: AgencyBrandingOutput | undefined,
): StatementPDFData["agency"] {
  return {
    name: agency?.name ?? "",
    email: agency?.email ?? "",
    whatsapp: agency?.phone ?? "",
    logoUrl: branding?.logoPath ? buildApiPublicFileUrl(branding.logoPath) : null,
    primaryColor: branding?.primaryColor ?? null,
    secondaryColor: branding?.secondaryColor ?? null,
    accentColor: branding?.accentColor ?? null,
    bankInfo:
      agency?.bankName || agency?.clabeNumber
        ? {
            bankName: agency.bankName ?? "",
            accountHolder: agency.bankAccountHolder ?? "",
            clabe: agency.clabeNumber ?? "",
          }
        : null,
    policies: agency?.policies ?? null,
  };
}

/** Datos del tour que el estado de cuenta del operador necesita además de la reserva. */
export interface OperatorStatementContext {
  agency: StatementPDFData["agency"];
  tourTitle: string;
  tourDepartureDate: string;
  tourReturnDate?: string | null;
  tourPostPaymentInstructions?: string | null;
  tourCurrency?: Currency;
}

type StatementSourcePassenger = {
  fullName: string;
  role: PassengerRole;
  whatsapp: string;
  seatLabel: string | null;
  boardingPoint: string | null;
  boardingPointDetails?: { location: string; time: string } | null;
};

const toStatementPassenger = (passenger: StatementSourcePassenger) => {
  const point = resolveBoardingPointDisplay(passenger);
  return {
    fullName: passenger.fullName,
    isMainPassenger: passenger.role === PASSENGER_ROLE.TITULAR,
    pickupPointName: point?.location ?? "Por coordinar",
    pickupTime: point?.time ?? null,
    seatNumber: passenger.seatLabel,
    // La API manda "Sin teléfono" cuando no hay WhatsApp; el PDF lo resuelve por dígitos.
    phone: passenger.whatsapp,
  };
};

/**
 * Estado de cuenta PDF de una reserva desde el Centro de Control (escritorio y celular). El
 * cliente solo ve abonos válidos (decisión del PM): sin REFUND ni el abono que una anulación
 * referencia con `(Ref: <id>)`.
 */
export function buildOperatorStatement(
  titular: TitularRowOutput,
  context: OperatorStatementContext,
): StatementPDFData {
  const payments = titular.payments || [];
  const validPayments = payments
    .filter(
      (payment) =>
        payment.type === "PAYMENT" &&
        !payments.some(
          (refund) =>
            refund.type === "REFUND" && refund.referenceInfo?.includes(`(Ref: ${payment.id})`),
        ),
    )
    .map((payment) => ({
      id: payment.id,
      date: payment.createdAt,
      amount: payment.amount,
      method: payment.method,
      reference: payment.referenceInfo ?? null,
    }));

  const groupPassengers = [titular, ...(titular.companions || [])];

  return {
    agency: context.agency,
    tour: {
      title: context.tourTitle,
      departureDate: context.tourDepartureDate,
      returnDate: context.tourReturnDate ?? null,
      totalPassengers: titular.groupSize,
      registeredPassengers: groupPassengers.length,
      postPaymentInstructions: context.tourPostPaymentInstructions ?? null,
    },
    passengers: groupPassengers.map(toStatementPassenger),
    financials: {
      currency: context.tourCurrency || DEFAULT_CURRENCY,
      totalAmount: titular.paidAmount + titular.balance,
      paidAmount: titular.paidAmount,
      balanceDue: titular.balance,
      payments: buildStatementPayments(validPayments),
    },
  };
}

/** Genera y descarga el PDF; si falla, avisa con un toast. */
export async function downloadOperatorStatement(
  titular: TitularRowOutput,
  context: OperatorStatementContext,
): Promise<void> {
  try {
    await generatePartialPaymentReceiptPDF(buildOperatorStatement(titular, context));
  } catch (error) {
    console.error("Error al generar el estado de cuenta PDF:", error);
    toast.error("No se pudo generar el estado de cuenta. Intenta de nuevo.");
  }
}

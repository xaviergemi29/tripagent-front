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
  PAYMENT_TYPE,
} from "@/shared/constants/domain.constants";
import { toast } from "sonner";

/**
 * Datos de la agencia para el estado de cuenta PDF que descarga el operador desde el Centro de
 * Control (equivalente a `buildMagicLinkStatement` en el portal del cliente). Todas las cuentas de
 * la agencia, sin número de tarjeta: el PDF solo lleva banco, titular y CLABE (decisión del PM,
 * regla 16).
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
    bankAccounts: (agency?.bankAccounts ?? []).map((account) => ({
      bankName: account.bankName,
      accountHolder: account.accountHolder,
      clabe: account.clabeNumber,
    })),
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

/**
 * Contexto para descargar el PDF: la agencia es `null` mientras sus datos (perfil, banco y marca) no
 * han cargado o si su consulta falló. En ese caso no se genera un PDF sin nombre ni CLABE (hasta el
 * 2026-11-16 salía así, sin aviso): se avisa y se reintenta con `onAgencyMissing`.
 */
export type OperatorStatementDownloadContext = Omit<OperatorStatementContext, "agency"> & {
  agency: StatementPDFData["agency"] | null;
  onAgencyMissing?: () => void;
};

/** Aviso cuando aún no están los datos de la agencia para el estado de cuenta. */
export const STATEMENT_AGENCY_MISSING_MESSAGE =
  "Aún no tenemos los datos de tu agencia (nombre, cuenta bancaria y logo) para el estado de cuenta.";

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
        payment.type === PAYMENT_TYPE.PAYMENT &&
        !payments.some(
          (refund) =>
            refund.type === PAYMENT_TYPE.REFUND &&
            refund.referenceInfo?.includes(`(Ref: ${payment.id})`),
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
  { agency, onAgencyMissing, ...tour }: OperatorStatementDownloadContext,
): Promise<void> {
  if (!agency) {
    toast.error(STATEMENT_AGENCY_MISSING_MESSAGE, {
      description: "Los estamos volviendo a pedir; intenta de nuevo en unos segundos.",
    });
    onAgencyMissing?.();
    return;
  }
  try {
    await generatePartialPaymentReceiptPDF(buildOperatorStatement(titular, { ...tour, agency }));
  } catch (error) {
    console.error("Error al generar el estado de cuenta PDF:", error);
    toast.error("No se pudo generar el estado de cuenta. Intenta de nuevo.");
  }
}

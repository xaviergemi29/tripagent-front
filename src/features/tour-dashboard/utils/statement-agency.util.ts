import type { AgencyOutput } from "@/features/settings/schemas/agency.schema";
import type { AgencyBrandingOutput } from "@/features/settings/schemas/branding.schema";
import type { StatementPDFData } from "@/features/statements/pdf/payment-receipt.pdf";
import { buildApiPublicFileUrl } from "@/shared/utils/share-links.util";

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

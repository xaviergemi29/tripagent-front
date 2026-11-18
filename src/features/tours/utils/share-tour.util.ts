import { toast } from "sonner";
import type { TourOutput } from "../schemas/tour.schema";
import { copyToClipboard } from "@/shared/utils/clipboard";
import { formatCurrency } from "@/shared/utils/currency.util";
import { formatSpanishLongDate } from "@/shared/utils/tour-date.util";
import { DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import { buildBrochureUrl } from "@/shared/utils/share-links.util";
import { isTourReadOnly } from "./tour-read-only.util";

/**
 * Copia al portapapeles el mensaje para compartir el folleto de un tour por WhatsApp (fecha,
 * anticipo si es mayor a cero y enlace a `/p/:id`). Antes vivía en `shared/utils/clipboard.ts`,
 * pero es lógica del catálogo de tours.
 */
export const canShareBrochure = (tour: Pick<TourOutput, "temporalStatus">): boolean =>
  !isTourReadOnly(tour);

export const handleShareLink = async (tour: TourOutput): Promise<void> => {
  const publicUrl = buildBrochureUrl(tour.id);
  const formattedDate = formatSpanishLongDate(tour.departureDateTime);
  const deposit = tour.depositPerPerson || 0;

  const formattedDeposit = formatCurrency(deposit, {
    currency: tour.currency || DEFAULT_CURRENCY,
  });

  const depositLine = deposit > 0 ? `💰 Aparta desde: ${formattedDeposit}\n` : "";

  const shareText = `🎒 ¡Hola! Te comparto la información completa para el ${tour.title}
🗓️ Salida: ${formattedDate}
${depositLine}Revisa todos los detalles (horarios, fotos y qué incluye) en nuestro folleto digital:
👉 ${publicUrl}

📲 Cualquier duda, respóndeme a este mensaje.`;

  const success = await copyToClipboard(shareText);

  if (success) {
    toast.success(
      "Información del folleto copiada al portapapeles. ¡Lista para enviar por WhatsApp!",
    );
  } else {
    toast.error("Error al copiar", {
      description: "No pudimos acceder al portapapeles. Intenta copiarlo manualmente.",
    });
  }
};

import { TourOutput } from "@/features/tours/schemas/tour.schema";
import { formatCurrency } from "./currency.util";
import { formatSpanishLongDate } from "./tour-date.util";
import { toast } from "sonner";
import { DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import { buildBrochureUrl } from "./share-links.util";

/**
 * @description Copia un texto al portapapeles del sistema operativo.
 * Implementa una estrategia de degradación elegante (Graceful Degradation):
 * 1. Intenta usar la API moderna `navigator.clipboard` (requiere HTTPS).
 * 2. Si falla o no está en un contexto seguro, hace fallback al método heredado `document.execCommand`.
 *
 * @param {string} text - El texto exacto a copiar.
 * @returns {Promise<boolean>} `true` si la operación fue exitosa, `false` en caso contrario.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  // 1. Intento con la API moderna (Solo funciona en HTTPS o localhost)
  if (navigator?.clipboard && window?.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn("Fallo al copiar con Clipboard API", error);
    }
  }

  // 2. Fallback clásico para HTTP en red local o navegadores/WebViews restringidos
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Estilos para que el textarea sea invisible y no altere el scroll visual del DOM
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("readonly", ""); // Evita que aparezca el teclado virtual en móviles

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    // 🚀 Tech Lead Note: Suprimimos el warning porque sabemos que está deprecado,
    // pero es nuestro único fallback vital para HTTP/WebViews antiguos.
    const successful = document.execCommand("copy");

    textArea.remove();

    return successful;
  } catch (error) {
    console.error("Fallo al copiar con execCommand", error);
    return false;
  }
};

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

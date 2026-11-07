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
    // @ts-ignore: document.execCommand is deprecated but required as fallback
    const successful = document.execCommand("copy");

    textArea.remove();

    return successful;
  } catch (error) {
    console.error("Fallo al copiar con execCommand", error);
    return false;
  }
};

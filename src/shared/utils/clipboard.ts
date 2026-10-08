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

  // 2. Fallback clásico para HTTP en red local o navegadores restringidos
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    console.log("entro al try 2");
    // Estilos para que el textarea sea invisible y no altere el scroll visual
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("readonly", ""); // Evita que aparezca el teclado en móviles

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    // 🚀 Suprimimos el warning porque sabemos que está deprecado,
    // pero es nuestro único fallback vital para HTTP/WebViews.
    // @ts-ignore: document.execCommand is deprecated but required as fallback
    const successful = document.execCommand("copy");

    textArea.remove();

    return successful;
  } catch (error) {
    console.error("Fallo al copiar con execCommand", error);
    return false;
  }
};

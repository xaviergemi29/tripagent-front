import { useSyncExternalStore } from "react";

/** Mismo corte que `md` de Tailwind: desde 768 px se usa el popover; abajo, el bottom sheet. */
const DESKTOP_QUERY = "(min-width: 768px)";

const subscribe = (onChange: () => void): (() => void) => {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

/**
 * ¿Pantalla de escritorio? En el servidor (y en la primera hidratación) responde `false`; la
 * campana es la misma en ambos tamaños, solo cambia el contenedor que abre.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

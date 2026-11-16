import type { GuidedTourDefinition, GuidedTourStep } from "../constants/guided-tours";

/** Atributo que marca los elementos que resalta una guía: `data-tour="<target>"`. */
export const GUIDED_TOUR_ATTRIBUTE = "data-tour";

const STORAGE_PREFIX = "tripagent:guided-tour";

export function buildGuidedTourStorageKey(tour: Pick<GuidedTourDefinition, "id" | "version">) {
  return `${STORAGE_PREFIX}:${tour.id}:v${tour.version}`;
}

/**
 * Primer elemento **visible** con `data-tour="<target>"`. Escritorio y celular usan componentes
 * distintos con la misma marca; el que está oculto (`hidden md:flex`, etc.) no tiene cajas.
 */
export function findVisibleTourTarget(target: string, root: ParentNode = document) {
  const candidates = root.querySelectorAll<HTMLElement>(`[${GUIDED_TOUR_ATTRIBUTE}="${target}"]`);
  return Array.from(candidates).find((element) => element.getClientRects().length > 0) ?? null;
}

export interface AvailableTourStep {
  step: GuidedTourStep;
  element: HTMLElement | null;
}

/**
 * Pasos que se pueden mostrar ahora: los generales (sin `target`) y los que tienen su elemento en
 * pantalla. Así una acción que no existe (p. ej. "Nueva Reserva" en Modo Auditoría) no deja un
 * globo flotando sin nada que señalar.
 */
export function resolveAvailableSteps(
  steps: GuidedTourStep[],
  root: ParentNode = document,
): AvailableTourStep[] {
  return steps.flatMap((step): AvailableTourStep[] => {
    if (!step.target) return [{ step, element: null }];
    const element = findVisibleTourTarget(step.target, root);
    return element ? [{ step, element }] : [];
  });
}

// localStorage puede fallar (ventana privada, datos bloqueados): la guía solo se vuelve a ofrecer.
export function hasSeenGuidedTour(storageKey: string): boolean {
  try {
    return window.localStorage.getItem(storageKey) === "seen";
  } catch {
    return false;
  }
}

export function markGuidedTourAsSeen(storageKey: string): void {
  try {
    window.localStorage.setItem(storageKey, "seen");
  } catch {
    // Sin almacenamiento la guía se abrirá otra vez la próxima visita; no es un error.
  }
}

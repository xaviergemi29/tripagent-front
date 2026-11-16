"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import type { Driver } from "driver.js";
import type { GuidedTourDefinition } from "../constants/guided-tours";
import {
  buildGuidedTourStorageKey,
  hasSeenGuidedTour,
  markGuidedTourAsSeen,
  resolveAvailableSteps,
} from "../utils/guided-tour.util";

/** Espera para que la pantalla termine de pintarse (animaciones, datos recién llegados). */
const AUTO_START_DELAY_MS = 600;

interface UseGuidedTourOptions {
  /** Abrir sola la primera vez. Pásalo en `true` solo cuando la pantalla ya tiene sus datos. */
  autoStart?: boolean;
}

/**
 * Guía interactiva con driver.js. Se abre sola la primera vez (si `autoStart`) y `start()` la
 * repite. Queda vista cuando la persona la cierra (terminar, ✕, Esc o clic fuera); salir de la
 * pantalla con la guía abierta no cuenta. Se recuerda en el `localStorage` del navegador.
 */
export function useGuidedTour(
  tour: GuidedTourDefinition,
  { autoStart = false }: UseGuidedTourOptions = {},
) {
  const driverRef = useRef<Driver | null>(null);
  const storageKey = buildGuidedTourStorageKey(tour);

  const start = async (): Promise<void> => {
    if (driverRef.current?.isActive()) return;

    const available = resolveAvailableSteps(tour.steps);
    if (available.length === 0) return;

    // Import diferido: driver.js solo se descarga cuando alguien abre una guía.
    const { driver } = await import("driver.js");
    const instance = driver({
      showProgress: available.length > 1,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Entendido",
      closeBtnLabel: "Cerrar guía",
      popoverClass: "tripagent-guided-tour",
      overlayColor: "#0f172a",
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 14,
      smoothScroll: true,
      // Durante la guía solo se mira: un clic en el elemento resaltado no dispara acciones.
      disableActiveInteraction: true,
      steps: available.map(({ step, element }) => ({
        element: element ?? undefined,
        popover: {
          title: step.title,
          description: step.description,
          side: step.side,
          align: step.align,
        },
      })),
      onDestroyed: (_element, _step, { reason }) => {
        // Vista solo si la cerró la persona (terminar, ✕, Esc o clic fuera). Un cierre por código
        // (`api`: salir de la pantalla o el recargado en caliente de desarrollo) no cuenta, para
        // que la guía se vuelva a ofrecer.
        if (reason !== "api") markGuidedTourAsSeen(storageKey);
        driverRef.current = null;
      },
    });
    driverRef.current = instance;
    instance.drive();
  };

  // Evento de efecto: el temporizador solo se reprograma al cambiar `autoStart` o la guía.
  const startFromEffect = useEffectEvent(() => void start());

  useEffect(() => {
    if (!autoStart || hasSeenGuidedTour(storageKey)) return;
    const timer = window.setTimeout(() => startFromEffect(), AUTO_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoStart, storageKey]);

  // Salir de la pantalla cierra la guía (no deja el overlay encima de otra página).
  useEffect(() => () => driverRef.current?.destroy(), []);

  return { start };
}

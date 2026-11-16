"use client";

import { GuidedTourButton } from "@/features/onboarding/components/GuidedTourButton";
import { SETTINGS_GUIDED_TOUR } from "@/features/onboarding/constants/guided-tours";
import { useGuidedTour } from "@/features/onboarding/hooks/useGuidedTour";

/**
 * «Ver guía» de Configuración. La página es un Server Component, así que la guía (que se abre
 * sola la primera vez: las pestañas se pintan sin esperar datos) vive en este componente cliente.
 */
export function SettingsGuideButton() {
  const { start } = useGuidedTour(SETTINGS_GUIDED_TOUR, { autoStart: true });
  return <GuidedTourButton onClick={() => void start()} className="self-start" />;
}

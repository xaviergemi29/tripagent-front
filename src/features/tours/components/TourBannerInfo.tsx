"use client";

import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TourBannerInfo() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("tripagent_dismiss_tour_banner");
    if (!isDismissed) setIsVisible(true);
  }, []);

  const handleDismiss = (): void => {
    localStorage.setItem("tripagent_dismiss_tour_banner", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-200/60 bg-blue-50/70 p-3.5 shadow-sm transition-all">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
      <div className="flex-1 pr-2">
        <p className="mb-0.5 text-sm font-semibold text-blue-900">Folleto Digital Interactivo</p>
        <p className="text-xs leading-relaxed text-blue-800">
          Al compartir este enlace por WhatsApp, tus clientes podrán revisar el itinerario, los
          puntos de abordaje y registrar sus datos para apartar su lugar en menos de 30 segundos.
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="-mt-1 -mr-1 h-8 w-8 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
        onClick={handleDismiss}
        aria-label="Cerrar aviso"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

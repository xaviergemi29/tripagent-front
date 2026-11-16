"use client";

import { useState, useSyncExternalStore } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_STORAGE_KEY = "tripagent_dismiss_tour_banner";

// localStorage puede lanzar (cookies bloqueadas, ventana privada de algunos navegadores). Hasta el
// 2026-11-16 se leía sin protección y el error tumbaba todo /tours; ahora, si falla, el aviso se
// muestra y cerrarlo solo dura mientras la pantalla siga abierta.
function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function saveDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, "true");
  } catch {
    // Sin almacenamiento el aviso volverá a aparecer en la próxima visita; no es un error.
  }
}

// Se lee como fuente externa (`useSyncExternalStore`) en lugar de copiarlo a un estado dentro de
// un efecto: en el servidor el aviso no se pinta (no hay localStorage) y el cliente lo resuelve al
// hidratar sin un render extra. El evento `storage` sincroniza otras pestañas.
function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function TourBannerInfo() {
  const storedDismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  const [dismissedNow, setDismissedNow] = useState(false);

  const handleDismiss = (): void => {
    saveDismissed();
    setDismissedNow(true);
  };

  if (storedDismissed || dismissedNow) return null;

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

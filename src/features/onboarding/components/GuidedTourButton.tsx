"use client";

import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOUR_TARGET } from "../constants/guided-tours";

/** Botón «Ver guía»: repite la guía interactiva de la pantalla (también es su último paso). */
export function GuidedTourButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-tour={TOUR_TARGET.GUIDE_BUTTON}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-xs transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700",
        className,
      )}
    >
      <CircleHelp className="h-4 w-4" aria-hidden />
      Ver guía
    </button>
  );
}

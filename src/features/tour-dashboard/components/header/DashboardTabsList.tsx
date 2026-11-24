"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Estilos del botón de pestaña: subrayado índigo en escritorio, segmento sólido en celular. */
const TAB_VARIANT = {
  underline: {
    base: "min-h-11 flex-row gap-2 border-b-2 px-4 text-sm",
    active: "border-indigo-600 bg-indigo-50/60 text-indigo-700",
    inactive:
      "border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900",
  },
  segment: {
    base: "min-h-14 flex-col gap-0.5 rounded-lg px-1 text-[11px] leading-tight",
    active: "bg-indigo-600 text-white shadow-sm",
    inactive: "text-slate-600 hover:bg-white hover:text-slate-900",
  },
} as const;

export type DashboardTabVariant = keyof typeof TAB_VARIANT;

/** Distintivo de conteo de una pestaña; el color cambia con el estado activo de la pestaña. */
export function tabCountClass(isActive: boolean, variant: DashboardTabVariant): string {
  if (isActive)
    return variant === "segment" ? "bg-white/25 text-white" : "bg-indigo-100 text-indigo-700";
  return "bg-slate-200/70 text-slate-600";
}

interface DashboardTabButtonProps {
  isActive: boolean;
  variant: DashboardTabVariant;
  onSelect: () => void;
  children: ReactNode;
}

/** Pestaña del Centro de Control (`role="tab"`, con tabulación solo en la activa). */
export function DashboardTabButton({
  isActive,
  variant,
  onSelect,
  children,
}: DashboardTabButtonProps) {
  const styles = TAB_VARIANT[variant];
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={onSelect}
      className={cn(
        "flex flex-1 items-center justify-center font-semibold whitespace-nowrap transition-colors",
        "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:outline-none",
        styles.base,
        isActive ? styles.active : styles.inactive,
      )}
    >
      {children}
    </button>
  );
}

interface DashboardTabListProps {
  label: string;
  className?: string;
  children: ReactNode;
}

/** Contenedor `role="tablist"` con navegación por flechas, Inicio y Fin (activa al enfocar). */
export function DashboardTabList({ label, className, children }: DashboardTabListProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const current = tabs.findIndex((tab) => tab === document.activeElement);
    if (current === -1) return;
    const target = {
      ArrowRight: (current + 1) % tabs.length,
      ArrowLeft: (current - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    tabs[target].focus();
    tabs[target].click();
  };

  return (
    <div role="tablist" aria-label={label} onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  );
}

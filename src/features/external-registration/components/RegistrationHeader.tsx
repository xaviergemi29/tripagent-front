"use client";

import { Compass, CheckCircle2, Lock } from "lucide-react";

interface RegistrationHeaderProps {
  agencyName?: string;
}

export function RegistrationHeader({ agencyName = "Brujitours" }: RegistrationHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-xl items-center justify-between">
        {/* Lado Izquierdo: Branding de Agencia y Verificación */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Compass className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-slate-900">{agencyName}</span>
              <CheckCircle2 className="h-4 w-4 fill-emerald-500 text-white" />
            </div>
            <span className="text-xs text-slate-500">Registro Oficial de Viajeros</span>
          </div>
        </div>

        {/* Lado Derecho: Indicador de Enlace Seguro */}
        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          <Lock className="h-3.5 w-3.5 text-slate-500" />
          <span>Enlace Seguro</span>
        </div>
      </div>
    </header>
  );
}

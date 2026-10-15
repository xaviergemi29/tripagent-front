"use client";

import Link from "next/link";
import { Settings, Info, Building2, ArrowRight } from "lucide-react";

interface AgencyBankDetailsBannerProps {
  bankName?: string | null;
  accountHolder?: string | null;
  clabe?: string | null;
  cardNumber?: string | null;
  settingsUrl?: string;
  className?: string;
}

export function AgencyBankDetailsBanner({
  bankName,
  accountHolder,
  clabe,
  cardNumber,
  settingsUrl = "/settings",
  className = "",
}: AgencyBankDetailsBannerProps) {
  const hasBankData = Boolean(bankName || accountHolder || clabe || cardNumber);

  return (
    <div
      className={`space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 transition-all sm:p-5 ${className}`}
    >
      <div className="flex flex-col justify-between gap-3 border-b border-indigo-100/60 pb-3 sm:flex-row sm:items-start">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-100/80 text-indigo-700">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs leading-snug font-bold tracking-wide text-slate-800 uppercase">
              Datos bancarios oficiales de tu agencia
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-indigo-500 uppercase">
              (Configurados en Ajustes)
            </span>
          </div>
        </div>

        <Link
          href={settingsUrl}
          className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-800 hover:underline"
        >
          <Settings className="h-3.5 w-3.5 text-indigo-600 transition-transform duration-200 group-hover:rotate-45" />
          <span>Editar en Configuración</span>
          <ArrowRight className="h-3 w-3 text-indigo-500 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {hasBankData ? (
        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 sm:gap-4">
          <div className="flex flex-col justify-center rounded-lg border border-slate-100 bg-white/90 p-3 shadow-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Banco
            </span>
            <span className="text-sm font-bold text-slate-800">{bankName || "No registrado"}</span>
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-slate-100 bg-white/90 p-3 shadow-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Titular de la Cuenta
            </span>
            <span className="line-clamp-2 text-sm leading-tight font-bold text-slate-800">
              {accountHolder || "No registrado"}
            </span>
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-slate-100 bg-white/90 p-3 shadow-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              CLABE Interbancaria
            </span>
            <span className="font-mono text-sm font-bold tracking-widest break-all text-slate-800">
              {clabe || "No registrada"}
            </span>
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-slate-100 bg-white/90 p-3 shadow-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Número de Tarjeta
            </span>
            <span className="font-mono text-sm font-bold tracking-widest break-all text-slate-800">
              {cardNumber || "No registrado"}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-amber-200/60 bg-amber-50 p-3.5 text-xs text-amber-800">
          <div className="flex items-center gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="font-medium">
              Aún no has configurado las cuentas bancarias oficiales de tu agencia.
            </span>
          </div>
          <Link
            href={settingsUrl}
            className="ml-3 shrink-0 font-bold text-amber-900 underline hover:text-amber-950"
          >
            Configurar ahora
          </Link>
        </div>
      )}

      <div className="flex items-start gap-1.5 pt-1 text-[11px] text-indigo-700/70">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p className="leading-relaxed font-medium">
          Estos datos se mostrarán automáticamente al viajero al elegir transferencia bancaria o
          depósito en el enlace de reservación.
        </p>
      </div>
    </div>
  );
}

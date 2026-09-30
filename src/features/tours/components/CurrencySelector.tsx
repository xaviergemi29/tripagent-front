"use client";

import { useController, useFormContext } from "react-hook-form";
import { HelpCircle, CheckCircle2, Lightbulb, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type CurrencyType = "MXN" | "USD";

export function CurrencySelector() {
  const { control } = useFormContext();

  const { field } = useController({
    name: "currency",
    control,
    defaultValue: "MXN",
  });

  const selectedCurrency = field.value as CurrencyType;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex flex-col justify-between gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold tracking-wider text-slate-700 uppercase">
            Moneda de cobro y cotización
          </span>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Ayuda sobre moneda"
                  className="rounded-full p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs rounded-lg bg-slate-900 p-2.5 text-xs text-slate-50 shadow-lg">
                Selecciona la divisa en la que está cotizado el viaje. Para viajes a Europa, USA o
                Sudamérica, elige USD.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          Define la moneda base de cálculo contable
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => field.onChange("MXN")}
          role="radio"
          aria-checked={selectedCurrency === "MXN"}
          className={`flex items-start justify-between rounded-xl border p-3.5 text-left transition-all ${
            selectedCurrency === "MXN"
              ? "border-indigo-600 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-600/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                selectedCurrency === "MXN"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              MXN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">MXN ($) — Pesos Mexicanos</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">Liquidación y cuentas locales</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full border-none bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
            >
              NACIONAL
            </Badge>
            {selectedCurrency === "MXN" && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
          </div>
        </button>

        <button
          type="button"
          onClick={() => field.onChange("USD")}
          role="radio"
          aria-checked={selectedCurrency === "USD"}
          className={`flex items-start justify-between rounded-xl border p-3.5 text-left transition-all ${
            selectedCurrency === "USD"
              ? "border-indigo-600 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-600/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                selectedCurrency === "USD"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              USD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  USD ($) — Dólares Estadounidenses
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">Destinos internacionales y aéreos</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
            >
              INTERNACIONAL
            </Badge>
            {selectedCurrency === "USD" && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
          </div>
        </button>
      </div>

      {selectedCurrency === "USD" && (
        <div className="animate-in fade-in-50 zoom-in-95 flex items-start gap-2.5 rounded-xl border border-indigo-100/90 bg-indigo-50/60 p-3.5 duration-200">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
          <p className="text-xs leading-relaxed font-medium text-indigo-950">
            <strong className="font-semibold text-indigo-900">Tour en USD:</strong> Los precios se
            registrarán en dólares. Al registrar abonos, podrás capturar el monto en USD y su
            equivalente en MXN manualmente.
          </p>
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
        <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>
          Selecciona la divisa en la que está cotizado el viaje. Para viajes a Europa, USA o
          Sudamérica, elige USD.
        </span>
      </div>
    </div>
  );
}

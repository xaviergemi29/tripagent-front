"use client";

import { formatCurrency } from "@/shared/utils/currency.util";
import { type Currency, DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";

interface TourSummaryCardProps {
  /** El nombre del tour y la fecha de salida los muestra el encabezado común (PublicBookingHeader). */
  tour: {
    priceTotalPerPassenger: number;
    depositPerPassenger?: number | null;
    currency?: Currency;
  };
  lockedSeatsCount: number;
}

export function TourSummaryCard({ tour, lockedSeatsCount }: TourSummaryCardProps) {
  const hasDeposit = Boolean(tour.depositPerPassenger && tour.depositPerPassenger > 0);
  const depositAmount = tour.depositPerPassenger ?? 0;
  const currency = tour.currency || DEFAULT_CURRENCY;

  const totalTourCost = tour.priceTotalPerPassenger * lockedSeatsCount;
  const totalDepositCost = depositAmount * lockedSeatsCount;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-xs">
      {/* Badge de Estado Superior */}
      <div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {lockedSeatsCount} {lockedSeatsCount === 1 ? "lugar apartado" : "lugares apartados"}
        </span>
      </div>

      {/* Módulo Financiero Condicional */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
        {hasDeposit ? (
          /* CASO A: Con Anticipo */
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            {/* Columna 1: Total */}
            <div className="pr-3">
              <span className="block text-xs text-slate-500">Costo total del viaje</span>
              <p className="text-base font-black text-slate-900">
                {formatCurrency(totalTourCost, { currency })}
              </p>
              <span className="block text-[11px] text-slate-400">
                ({formatCurrency(tour.priceTotalPerPassenger, { currency })} por persona)
              </span>
            </div>

            {/* Columna 2: Anticipo */}
            <div className="pl-3 text-right">
              <span className="block text-xs text-slate-500">Anticipo para apartar</span>
              <p className="text-sm font-bold text-emerald-600">
                {formatCurrency(depositAmount, { currency })} / persona
              </p>
              <span className="block text-[11px] font-semibold text-slate-700">
                Total a anticipar: {formatCurrency(totalDepositCost, { currency })}
              </span>
            </div>
          </div>
        ) : (
          /* CASO B: Sin Anticipo ($0 o Null) */
          <div>
            <span className="block text-xs text-slate-500">
              Costo total de la experiencia ({lockedSeatsCount}{" "}
              {lockedSeatsCount === 1 ? "viajero" : "viajeros"})
            </span>
            <p className="text-lg font-black text-slate-900">
              {formatCurrency(totalTourCost, { currency })}
            </p>
            <span className="block text-xs text-slate-400">
              ({formatCurrency(tour.priceTotalPerPassenger, { currency })} por persona)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

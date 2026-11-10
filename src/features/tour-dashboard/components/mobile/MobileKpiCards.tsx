import { Users, Banknote, BusFront } from "lucide-react";
import { formatCurrency } from "@/shared/utils/currency.util";

interface MobileKpiCardsProps {
  metrics: {
    occupancy: { max: number; current: number };
    revenue: { projected: number; collected: number };
    logistics: { total: number; assigned: number; unassigned: number };
  };
}

export function MobileKpiCards({ metrics }: MobileKpiCardsProps) {
  const { occupancy, revenue, logistics } = metrics;
  const occupancyPercentage =
    occupancy.max > 0 ? Math.round((occupancy.current / occupancy.max) * 100) : 0;
  const availableSeats = occupancy.max - occupancy.current;
  const pendingBalance = revenue.projected - revenue.collected;

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Ocupación & Cupos */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <div className="rounded-full bg-slate-100 p-1.5 text-slate-600">
            <Users className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold tracking-wider text-slate-500">OCUPACIÓN & CUPOS</span>
        </div>
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">
            {occupancy.current} / {occupancy.max}
          </span>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
            {occupancyPercentage}%
          </span>
        </div>
        <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600"
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
        <p className="text-xs font-medium text-slate-500">
          {availableSeats} lugares libres para vender
        </p>
      </div>

      {/* 2. Finanzas & Cobranza */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-slate-100 p-1.5 text-slate-600">
              <Banknote className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold tracking-wider text-slate-500">
              FINANZAS & COBRANZA
            </span>
          </div>
        </div>
        <div className="mb-2">
          <span className="text-2xl font-black text-slate-900">
            {formatCurrency(revenue.collected)}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-500">
            Proyectado total: {formatCurrency(revenue.projected)}
          </span>
          {pendingBalance > 0 ? (
            <span className="font-semibold text-red-600">
              Por recaudar: {formatCurrency(pendingBalance)}
            </span>
          ) : (
            <span className="font-semibold text-emerald-600">Cobranza completada</span>
          )}
        </div>
      </div>

      {/* 3. Logística de Asientos */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <div className="rounded-full bg-slate-100 p-1.5 text-slate-600">
            <BusFront className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold tracking-wider text-slate-500">
            LOGÍSTICA DE ASIENTOS
          </span>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-2xl font-black text-slate-900">
            {logistics.unassigned} Sin Asiento
          </span>
        </div>
        {logistics.unassigned > 0 && (
          <div className="mb-2 inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            ⚠️ Faltan {logistics.unassigned} por asignar
          </div>
        )}
        <p className="text-xs font-medium text-slate-500">
          Asignados: {logistics.assigned} de {logistics.total} pasajeros
        </p>
      </div>
    </div>
  );
}

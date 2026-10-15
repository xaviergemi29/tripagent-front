"use client";

import { useMemo } from "react";
import { Users, AlertCircle, Bus, Banknote, CheckCircle2, Plus, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TourMetrics, Currency } from "../schemas/tour-dashboard.schema";
import { formatLocalDate } from "@/shared/utils/tour-date.util";
import { formatCurrency } from "@/shared/utils/currency.util";

interface TourDashboardHeaderProps {
  title: string;
  departureDateTime: string;
  currency: Currency;
  metrics: TourMetrics;
  logistics: { assigned: number; total: number; unassigned: number };
  onNewReservation?: () => void;
}

export function TourDashboardHeader({
  title,
  departureDateTime,
  currency,
  metrics,
  logistics,
  onNewReservation,
}: TourDashboardHeaderProps) {
  const occupancyStats = useMemo(() => {
    const maxCapacity = metrics.occupancy.max;
    const currentOccupancy = metrics.occupancy.current;
    const availableSeats = Math.max(0, maxCapacity - currentOccupancy);
    const occupancyPercentage =
      maxCapacity > 0 ? Math.round((currentOccupancy / maxCapacity) * 100) : 0;

    return { maxCapacity, currentOccupancy, availableSeats, occupancyPercentage };
  }, [metrics.occupancy]);

  const financeStats = useMemo(() => {
    // Confiamos ciegamente en el BE. Adiós a iterar .reduce() en el FE.
    const totalCollected = metrics.revenue.collected;
    const totalProjected = metrics.revenue.projected;
    const balanceDue = Math.max(0, totalProjected - totalCollected);

    return { totalCollected, totalProjected, balanceDue };
  }, [metrics.revenue]);

  // Formateo de fecha
  const formattedDate = departureDateTime
    ? formatLocalDate(departureDateTime)
    : "Fecha por definir";
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="space-y-6 border-b bg-white px-6 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <div className="mt-1.5 inline-flex items-center gap-2 text-sm font-medium text-slate-500">
            <Calendar className="h-4 w-4 shrink-0 text-indigo-600" />
            <span className="font-semibold text-slate-800">Salida:</span>
            <span>{displayDate}</span>
          </div>
        </div>
        {onNewReservation && (
          <div>
            <Button
              size="lg"
              className="w-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 sm:w-auto"
              onClick={onNewReservation}
            >
              <Plus className="mr-2 h-5 w-5" /> Nueva Reserva
            </Button>
          </div>
        )}
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: OCCUPANCY */}
        <Card className="flex flex-col justify-between border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Ocupación & Cupos
              </span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {occupancyStats.currentOccupancy}
              </span>
              <span className="text-lg font-semibold text-slate-400">
                / {occupancyStats.maxCapacity}
              </span>
              <Badge
                variant="secondary"
                className={`ml-auto border font-bold ${
                  occupancyStats.occupancyPercentage >= 100
                    ? "border-red-200 bg-red-50 text-red-700"
                    : occupancyStats.occupancyPercentage > 70
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-indigo-200 bg-indigo-50 text-indigo-700"
                }`}
              >
                {occupancyStats.occupancyPercentage}%
              </Badge>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  occupancyStats.occupancyPercentage >= 100
                    ? "bg-red-500"
                    : occupancyStats.occupancyPercentage > 70
                      ? "bg-emerald-500"
                      : "bg-indigo-600"
                }`}
                style={{ width: `${Math.min(100, occupancyStats.occupancyPercentage)}%` }}
              />
            </div>
          </div>

          <p className="mt-3 text-xs font-medium text-slate-500">
            {occupancyStats.maxCapacity === 0
              ? "⚠️ Asigna un vehículo para fijar cupo"
              : occupancyStats.availableSeats > 0
                ? `${occupancyStats.availableSeats} lugares libres para vender`
                : "Cupo completo (100% vendido)"}
          </p>
        </Card>

        {/* KPI 2: FINANCES */}
        <Card className="flex flex-col justify-between border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Finanzas & Cobranza
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Banknote className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-slate-900">
                {formatCurrency(financeStats.totalCollected, { currency })}
              </span>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Proyectado total:{" "}
              <span className="font-semibold text-slate-700">
                {formatCurrency(financeStats.totalProjected, { currency })}
              </span>
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
            <span className="font-medium text-slate-500">Por recaudar:</span>
            <span className="font-bold text-rose-600">
              {formatCurrency(financeStats.balanceDue, { currency })}
            </span>
          </div>
        </Card>

        {/* KPI 3: PENDING VALIDATIONS */}
        <Card
          className={`flex flex-col justify-between border p-5 shadow-sm ${
            metrics.pendingValidations > 0
              ? "border-orange-200 bg-orange-50/50"
              : "border-slate-200/80 bg-white"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Por Validar
              </span>
              <div className="rounded-lg bg-orange-100 p-2 text-orange-700">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-3xl font-black tracking-tight ${
                  metrics.pendingValidations > 0 ? "text-orange-700" : "text-slate-900"
                }`}
              >
                {metrics.pendingValidations}
              </span>
              <span className="text-sm font-semibold text-slate-500">Pagos</span>
            </div>
          </div>

          <p className="mt-3 text-xs font-medium text-slate-500">
            {metrics.pendingValidations > 0
              ? "Requiere revisión manual de comprobantes"
              : "Sin pagos pendientes de validación"}
          </p>
        </Card>

        {/* KPI 4: LOGISTICS */}
        <Card className="flex flex-col justify-between border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Logística de Abordaje
              </span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Bus className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">
                {logistics.unassigned}
              </span>
              <span className="text-sm font-semibold text-slate-500">Sin Asiento</span>
            </div>

            <div className="mt-1 flex items-center gap-1 text-xs font-semibold">
              {logistics.unassigned === 0 ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 100% asignados
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5" /> {logistics.unassigned} asignación
                  pendiente
                </span>
              )}
            </div>
          </div>

          <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs font-medium text-slate-500">
            Asignados: <strong className="text-slate-800">{logistics.assigned}</strong> de{" "}
            <strong className="text-slate-800">{logistics.total}</strong> pasajeros
          </p>
        </Card>
      </div>
    </div>
  );
}

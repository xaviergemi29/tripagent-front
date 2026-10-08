"use client";

import { useMemo } from "react";
import {
  Users,
  DollarSign,
  AlertCircle,
  Bus,
  Banknote,
  CheckCircle2,
  Plus,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TourMetrics } from "../schemas/tour-dashboard.schema";
import { formatLocalDate } from "@/shared/utils/tour-date.util";

// 🛡️ Helper centralizado para formateo seguro de moneda
const formatCurrency = (amount: number, currency: string = "MXN") => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

interface TourDashboardHeaderProps {
  title: string;
  date: string;
  metrics: TourMetrics;
  tour?: any; // DTO completo del tour para datos adicionales (currency, price, boardingPoints)
  bookings?: any[]; // Opcional: si se pasan bookings para derivar cobranza granular
  passengers?: any[]; // Opcional: si se pasan pasajeros aplanados para derivar paradas
  logistics?: { assigned: number; total: number; unassigned: number };
  onNewReservation?: () => void;
}

export function TourDashboardHeader({
  title,
  date,
  metrics,
  tour,
  bookings = [],
  passengers = [],
  logistics,
  onNewReservation,
}: TourDashboardHeaderProps) {
  // ==========================================================================
  // 1. ESTADO DERIVADO: OCUPACIÓN & CUPOS
  // ==========================================================================
  const ocupacion = useMemo(() => {
    const capacidadTotal = metrics?.occupancy?.max || tour?.maxCapacity || 0;
    const lugaresOcupados = metrics?.occupancy?.current || 0;
    const lugaresDisponibles = Math.max(0, capacidadTotal - lugaresOcupados);
    const porcentaje =
      capacidadTotal > 0 ? Math.round((lugaresOcupados / capacidadTotal) * 100) : 0;

    return { capacidadTotal, lugaresOcupados, lugaresDisponibles, porcentaje };
  }, [metrics, tour]);

  // ==========================================================================
  // 2. ESTADO DERIVADO: FINANZAS & COBRANZA
  // ==========================================================================
  const finanzas = useMemo(() => {
    const currency = tour?.currency || "MXN";
    const precioUnitario = tour?.price || tour?.total_price || 0;
    const capacidad = ocupacion.capacidadTotal;

    // Total ingresado en firme desde metrics o reduciendo bookings
    const totalCobrado =
      metrics?.revenue?.collected ??
      bookings.reduce((acc, b) => acc + (b.amountPaid || b.total_paid || 0), 0);

    // Proyección al 100% de aforo
    const proyectadoTotal = metrics?.revenue?.projected ?? capacidad * precioUnitario;

    // Deuda por recaudar de los pasajeros actualmente registrados
    const totalComprometido =
      bookings.length > 0
        ? bookings.reduce((acc, b) => acc + (b.totalPrice || b.total_amount || 0), 0)
        : proyectadoTotal;

    const porRecaudar = Math.max(0, totalComprometido - totalCobrado);

    return { totalCobrado, proyectadoTotal, porRecaudar, currency };
  }, [metrics, tour, bookings, ocupacion.capacidadTotal]);

  // ==========================================================================
  // 3. ESTADO DERIVADO: LOGÍSTICA DE ABORDAJE
  // ==========================================================================
  const logistica = useMemo(() => {
    if (logistics) return logistics;

    const pasajerosConAbono = passengers.filter(
      (p) => p.has_deposit || p.paymentStatus !== "PENDING",
    );

    const unassigned = pasajerosConAbono.filter(
      (p) => !p.seatLabel && !p.seat_number && !p.assigned_seat,
    ).length;

    const total = passengers.length;
    const assigned = total - unassigned;

    return { assigned, total, unassigned };
  }, [logistics, passengers]);

  // Formateo de fecha de salida sin desfase UTC
  const formattedDate = date ? formatLocalDate(date) : "Fecha por definir";
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="space-y-6 border-b bg-white px-6 py-8">
      {/* CABECERA PRINCIPAL Y BOTÓN DE ACCIÓN */}
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

      {/* GRID DE KPIs (4 COLUMNAS SIMÉTRICAS) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: OCUPACIÓN & CUPOS */}
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
                {ocupacion.lugaresOcupados}
              </span>
              <span className="text-lg font-semibold text-slate-400">
                / {ocupacion.capacidadTotal}
              </span>
              <Badge
                variant="secondary"
                className={`ml-auto border font-bold ${
                  ocupacion.porcentaje >= 100
                    ? "border-red-200 bg-red-50 text-red-700"
                    : ocupacion.porcentaje > 70
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-indigo-200 bg-indigo-50 text-indigo-700"
                }`}
              >
                {ocupacion.porcentaje}%
              </Badge>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  ocupacion.porcentaje >= 100
                    ? "bg-red-500"
                    : ocupacion.porcentaje > 70
                      ? "bg-emerald-500"
                      : "bg-indigo-600"
                }`}
                style={{ width: `${Math.min(100, ocupacion.porcentaje)}%` }}
              />
            </div>
          </div>

          <p className="mt-3 text-xs font-medium text-slate-500">
            {ocupacion.capacidadTotal === 0
              ? "⚠️ Asigna un vehículo para fijar cupo"
              : ocupacion.lugaresDisponibles > 0
                ? `${ocupacion.lugaresDisponibles} lugares libres para vender`
                : "Cupo completo (100% vendido)"}
          </p>
        </Card>

        {/* KPI 2: FINANZAS & COBRANZA */}
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
                {formatCurrency(finanzas.totalCobrado, finanzas.currency)}
              </span>
              <span className="text-xs font-bold text-slate-400">{finanzas.currency}</span>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Proyectado total:{" "}
              <span className="font-semibold text-slate-700">
                {formatCurrency(finanzas.proyectadoTotal, finanzas.currency)} {finanzas.currency}
              </span>
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
            <span className="font-medium text-slate-500">Por recaudar:</span>
            <span className="font-bold text-rose-600">
              {formatCurrency(finanzas.porRecaudar, finanzas.currency)} {finanzas.currency}
            </span>
          </div>
        </Card>

        {/* KPI 3: PAGOS POR VALIDAR */}
        <Card
          className={`flex flex-col justify-between border p-5 shadow-sm ${
            metrics?.pendingValidations > 0
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
                  metrics?.pendingValidations > 0 ? "text-orange-700" : "text-slate-900"
                }`}
              >
                {metrics?.pendingValidations || 0}
              </span>
              <span className="text-sm font-semibold text-slate-500">Pagos</span>
            </div>
          </div>

          <p className="mt-3 text-xs font-medium text-slate-500">
            {metrics?.pendingValidations > 0
              ? "Requiere revisión manual de comprobantes"
              : "Sin pagos pendientes de validación"}
          </p>
        </Card>

        {/* KPI 4: LOGÍSTICA DE ABORDAJE */}
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
                {logistica.unassigned}
              </span>
              <span className="text-sm font-semibold text-slate-500">Sin Asiento</span>
            </div>

            <div className="mt-1 flex items-center gap-1 text-xs font-semibold">
              {logistica.unassigned === 0 ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 100% asignados con abono
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5" /> {logistica.unassigned} asignación
                  pendiente
                </span>
              )}
            </div>
          </div>

          <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs font-medium text-slate-500">
            Asignados: <strong className="text-slate-800">{logistica.assigned}</strong> de{" "}
            <strong className="text-slate-800">{logistica.total}</strong> pasajeros
          </p>
        </Card>
      </div>
    </div>
  );
}

import { Users, DollarSign, AlertCircle, FileWarning, Plus } from "lucide-react";
import type { TourMetrics } from "../schemas/tour-dashboard.schema";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  date: string;
  metrics: TourMetrics;
  onNewReservation?: () => void;
}

export function TourDashboardHeader({ title, date, metrics, onNewReservation }: Props) {
  const occupancyPercentage = (metrics?.occupancy?.current / metrics?.occupancy?.max) * 100;

  // Lógica visual para la barra de ocupación
  const occupancyColor =
    occupancyPercentage >= 100
      ? "bg-red-500"
      : occupancyPercentage > 80
        ? "bg-orange-500"
        : "bg-emerald-500";

  return (
    <div className="space-y-6 border-b bg-white px-6 py-8">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="font-medium text-slate-500">
            Salida: {new Date(date).toLocaleDateString("es-MX", { dateStyle: "long" })}
          </p>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI: Ocupación */}
        <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-sm font-semibold tracking-wider uppercase">Ocupación</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.occupancy.current}{" "}
            <span className="text-lg font-medium text-slate-400">/ {metrics?.occupancy.max}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div
              className={`h-2 rounded-full ${occupancyColor}`}
              style={{ width: `${occupancyPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* KPI: Finanzas */}
        <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-sm font-semibold tracking-wider uppercase">Ingresos</span>
            <DollarSign className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${metrics?.revenue?.collected?.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500">
            Proyectado: ${metrics?.revenue?.projected?.toLocaleString()} MXN
          </p>
        </div>

        {/* KPI: Validaciones Pendientes (Alerta Visual) */}
        <div
          className={`space-y-3 rounded-xl border p-4 ${metrics?.pendingValidations > 0 ? "border-orange-200 bg-orange-50" : "bg-slate-50"}`}
        >
          <div
            className={`flex items-center justify-between ${metrics?.pendingValidations > 0 ? "text-orange-700" : "text-slate-600"}`}
          >
            <span className="text-sm font-semibold tracking-wider uppercase">Por Validar</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <div
            className={`text-2xl font-bold ${metrics?.pendingValidations > 0 ? "text-orange-700" : "text-slate-900"}`}
          >
            {metrics?.pendingValidations}{" "}
            <span className="text-lg font-medium opacity-70">Pagos</span>
          </div>
        </div>

        {/* KPI: Formularios Pendientes (Alerta Visual) */}
        <div
          className={`space-y-3 rounded-xl border p-4 ${metrics?.pendingForms > 0 ? "border-red-200 bg-red-50" : "bg-slate-50"}`}
        >
          <div
            className={`flex items-center justify-between ${metrics?.pendingForms > 0 ? "text-red-700" : "text-slate-600"}`}
          >
            <span className="text-sm font-semibold tracking-wider uppercase">Riesgo Logístico</span>
            <FileWarning className="h-4 w-4" />
          </div>
          <div
            className={`text-2xl font-bold ${metrics?.pendingForms > 0 ? "text-red-700" : "text-slate-900"}`}
          >
            {metrics?.pendingForms}{" "}
            <span className="text-lg font-medium opacity-70">Faltantes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

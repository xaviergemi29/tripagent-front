import { Users, DollarSign, AlertCircle, FileWarning, Plus } from "lucide-react";
import type { TourMetrics } from "../schemas/tourDashboardSchema";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  date: string;
  metrics: TourMetrics;
  onNewReservation: () => void; // 👈 Prop para disparar el modal
}

export function TourDashboardHeader({ title, date, metrics, onNewReservation }: Props) {
  const occupancyPercentage = (metrics?.occupancy?.current / metrics?.occupancy?.max) * 100;

  // Lógica visual para la barra de ocupación
  const occupancyColor =
    occupancyPercentage >= 100 ? "bg-red-500" :
      occupancyPercentage > 80 ? "bg-orange-500" : "bg-emerald-500";

  return (
    <div className="bg-white border-b px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-500 font-medium">
          Salida: {new Date(date).toLocaleDateString('es-MX', { dateStyle: 'long' })}
        </p>
        {/* Botón primario destacado contextualmente */}
        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md w-full sm:w-auto" onClick={onNewReservation}>
          <Plus className="w-5 h-5 mr-2" /> Nueva Reserva
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Ocupación */}
        <div className="p-4 rounded-xl border bg-slate-50 space-y-3">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-sm font-semibold uppercase tracking-wider">Ocupación</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.occupancy.current} <span className="text-lg text-slate-400 font-medium">/ {metrics?.occupancy.max}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${occupancyColor}`} style={{ width: `${occupancyPercentage}%` }}></div>
          </div>
        </div>

        {/* KPI: Finanzas */}
        <div className="p-4 rounded-xl border bg-slate-50 space-y-3">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-sm font-semibold uppercase tracking-wider">Ingresos</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${metrics?.revenue?.collected?.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500">
            Proyectado: ${metrics?.revenue?.projected?.toLocaleString()} MXN
          </p>
        </div>

        {/* KPI: Validaciones Pendientes (Alerta Visual) */}
        <div className={`p-4 rounded-xl border space-y-3 ${metrics?.pendingValidations > 0 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50'}`}>
          <div className={`flex items-center justify-between ${metrics?.pendingValidations > 0 ? 'text-orange-700' : 'text-slate-600'}`}>
            <span className="text-sm font-semibold uppercase tracking-wider">Por Validar</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className={`text-2xl font-bold ${metrics?.pendingValidations > 0 ? 'text-orange-700' : 'text-slate-900'}`}>
            {metrics?.pendingValidations} <span className="text-lg font-medium opacity-70">Pagos</span>
          </div>
        </div>

        {/* KPI: Formularios Pendientes (Alerta Visual) */}
        <div className={`p-4 rounded-xl border space-y-3 ${metrics?.pendingForms > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50'}`}>
          <div className={`flex items-center justify-between ${metrics?.pendingForms > 0 ? 'text-red-700' : 'text-slate-600'}`}>
            <span className="text-sm font-semibold uppercase tracking-wider">Riesgo Logístico</span>
            <FileWarning className="w-4 h-4" />
          </div>
          <div className={`text-2xl font-bold ${metrics?.pendingForms > 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {metrics?.pendingForms} <span className="text-lg font-medium opacity-70">Faltantes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
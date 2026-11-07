"use client";

import { Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PaymentFilter, RegistrationFilter, SeatFilter } from "./DashboardTravelerTable";

interface TravelersTableToolbarProps {
  tourId: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  paymentFilter: PaymentFilter | string;
  onPaymentFilterChange: (val: PaymentFilter | string) => void;
  formFilter: RegistrationFilter | string;
  onFormFilterChange: (val: RegistrationFilter | string) => void;
  seatFilter: SeatFilter | string;
  onSeatFilterChange: (val: SeatFilter | string) => void;
}

export function TravelersTableToolbar({
  tourId,
  searchQuery,
  onSearchChange,
  paymentFilter,
  onPaymentFilterChange,
  formFilter,
  onFormFilterChange,
  seatFilter,
  onSeatFilterChange,
}: TravelersTableToolbarProps) {
  const handlePrintPDF = (): void => {
    window.open(`/pdf-tour/${tourId}`, "_blank");
  };

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm xl:flex-row xl:items-center">
      {/* SECCIÓN DE FILTROS */}
      <div className="flex w-full flex-wrap gap-3 xl:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar viajero o teléfono..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <select
          className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          value={paymentFilter}
          onChange={(e) => onPaymentFilterChange(e.target.value)}
        >
          <option value="ALL">Pagos: Todos</option>
          <option value="UNPAID">Sin Pago</option>
          <option value="PARTIAL">Abono Parcial / Validando</option>
          <option value="PAID">Liquidados</option>
        </select>

        <select
          className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          value={formFilter}
          onChange={(e) => onFormFilterChange(e.target.value)}
        >
          <option value="ALL">Formularios: Todos</option>
          <option value="PENDING">Pendientes (Alerta)</option>
          <option value="COMPLETED">Completos</option>
        </select>

        <select
          className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          value={seatFilter}
          onChange={(e) => onSeatFilterChange(e.target.value)}
        >
          <option value="ALL">Asientos: Todos</option>
          <option value="UNASSIGNED">Sin Asignar</option>
          <option value="ASSIGNED">Asignados</option>
        </select>
      </div>

      {/* SECCIÓN DE ACCIONES */}
      <div className="flex w-full flex-wrap justify-end gap-2 xl:w-auto">
        <Button
          className="bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98]"
          onClick={handlePrintPDF}
        >
          <FileText className="mr-2 h-4 w-4" />
          Descargar Lista de Abordaje
        </Button>
      </div>
    </div>
  );
}

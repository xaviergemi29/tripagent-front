"use client";

import { Search, Download, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TravelerRow } from "../schemas/tourDashboardSchema";

interface Props {
  travelers: TravelerRow[]; // Recibimos la lista completa para exportar
  searchQuery: string;
  onSearchChange: (val: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (val: string) => void;
  formFilter: string;
  onFormFilterChange: (val: string) => void;
  onAddTravelerClick: () => void;
}

export function TravelersTableToolbar({
  travelers,
  searchQuery,
  onSearchChange,
  paymentFilter,
  onPaymentFilterChange,
  formFilter,
  onFormFilterChange,
  onAddTravelerClick,
}: Props) {

  // Función de Exportación CSV ligera para el Guía
  const handleExportCSV = () => {
    if (!travelers || travelers.length === 0) return;

    const headers = ["Nombre Completo", "Rol", "WhatsApp", "Estado Pago", "Monto Pagado", "Saldo Pendiente", "Formulario Salud"];
    const rows = travelers.map(t => [
      `"${t.fullName}"`,
      `"${t.role}"`,
      `"${t.whatsapp}"`,
      `"${t.paymentStatus}"`,
      t.paidAmount,
      t.balance,
      `"${t.formStatus}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lista_Guia_Tour_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar viajero o teléfono..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <select 
          className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={paymentFilter}
          onChange={(e) => onPaymentFilterChange(e.target.value)}
        >
          <option value="ALL">Pagos: Todos</option>
          <option value="PENDING_VALIDATION">Pendiente Validar</option>
          <option value="PAID">Liquidados</option>
          <option value="ADVANCE">Con Anticipo</option>
          <option value="PENDING">Sin Pago</option>
        </select>

        <select 
          className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={formFilter}
          onChange={(e) => onFormFilterChange(e.target.value)}
        >
          <option value="ALL">Formularios: Todos</option>
          <option value="PENDING">Pendientes (Alerta)</option>
          <option value="COMPLETED">Capturados</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-end">
        <Button variant="outline" size="sm" className="text-slate-700" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" /> Exportar Lista Guía
        </Button>
      </div>
    </div>
  );
}
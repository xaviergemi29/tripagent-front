"use client";

import { Search, FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TitularRowDTO } from "../schemas/tour-dashboard.schema";
import type { PaymentFilter, RegistrationFilter, SeatFilter } from "./DashboardTravelerTable";

interface TravelersTableToolbarProps {
  travelers: TitularRowDTO[];
  tourId: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  paymentFilter: PaymentFilter | string;
  onPaymentFilterChange: (val: PaymentFilter | string) => void;
  formFilter: RegistrationFilter | string;
  onFormFilterChange: (val: RegistrationFilter | string) => void;
  seatFilter: SeatFilter | string;
  onSeatFilterChange: (val: SeatFilter | string) => void;
  isAuditMode?: boolean;
}

export function TravelersTableToolbar({
  travelers,
  tourId,
  searchQuery,
  onSearchChange,
  paymentFilter,
  onPaymentFilterChange,
  formFilter,
  onFormFilterChange,
  seatFilter,
  onSeatFilterChange,
  isAuditMode,
}: TravelersTableToolbarProps) {
  const handleExportCSV = () => {
    if (!travelers || travelers.length === 0) return;

    const headers = [
      "Nombre Completo",
      "Rol",
      "WhatsApp",
      "Estado Pago",
      "Monto Pagado",
      "Saldo Pendiente",
      "Formulario Salud",
    ];

    // Aplanamos pasajeros para el CSV
    const allPassengers = travelers.flatMap((t) => [t, ...(t.companions || [])]);

    const rows = allPassengers.map((t) => {
      // 🚀 Type Guard: Usamos el rol como llave discriminadora
      const isTitular = t.role === "TITULAR";

      // TypeScript ahora sabe que si es Titular, las propiedades existen.
      const paymentStatus = isTitular ? t.paymentStatus : "Cubierto por titular";
      const paidAmount = isTitular ? t.paidAmount : 0;
      const balance = isTitular ? t.balance : 0;

      return [
        `"${t.fullName}"`,
        `"${t.role}"`,
        `"${t.whatsapp}"`,
        `"${paymentStatus}"`,
        paidAmount,
        balance,
        `"${t.formStatus}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lista_Guia_Tour_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.open(`/pdf-tour/${tourId}`, "_blank");
  };

  const PrimaryAction = isAuditMode ? handleExportCSV : handlePrintPDF;
  const PrimaryIcon = isAuditMode ? FileSpreadsheet : FileText;
  const primaryLabel = isAuditMode ? "Exportar Contabilidad (CSV)" : "Imprimir Lista de Guía";

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm xl:flex-row xl:items-center">
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

      <div className="flex w-full flex-wrap justify-end gap-2 xl:w-auto">
        <DropdownMenu>
          <div className="flex rounded-md shadow-sm">
            <Button
              className="rounded-r-none bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={PrimaryAction}
            >
              <PrimaryIcon className="mr-2 h-4 w-4" /> {primaryLabel}
            </Button>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-l-none border-l border-indigo-700 bg-indigo-600 px-2 text-white hover:bg-indigo-700">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handlePrintPDF} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4 text-slate-500" />
              <span>Lista para Guía (Imprimible)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
              <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Reporte Contable (CSV)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

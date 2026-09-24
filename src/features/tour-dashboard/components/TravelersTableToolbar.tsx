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
import type { TravelerRow } from "../schemas/tour-dashboard.schema";

interface Props {
  travelers: TravelerRow[];
  tourId: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (val: string) => void;
  formFilter: string;
  onFormFilterChange: (val: string) => void;
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
  isAuditMode,
}: Props) {
  // Función de Exportación CSV ligera para el Guía
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
    const rows = travelers.map((t) => [
      `"${t.fullName}"`,
      `"${t.role}"`,
      `"${t.whatsapp}"`,
      `"${t.paymentStatus}"`,
      t.paidAmount,
      t.balance,
      `"${t.formStatus}"`,
    ]);

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
    // Pro-Tip: Abrir el HTML de impresión en una nueva pestaña que se cierra sola
    const printWindow = window.open(`/pdf-tour/${tourId}`, "_blank");
    // En la página destino (/manifest/page.tsx) pondremos un useEffect que lance window.print()
  };

  // 🚀 Lógica de Smart Default: Si el tour terminó, la acción principal es CSV.
  const PrimaryAction = isAuditMode ? handleExportCSV : handlePrintPDF;
  const PrimaryIcon = isAuditMode ? FileSpreadsheet : FileText;
  const primaryLabel = isAuditMode ? "Exportar Contabilidad (CSV)" : "Imprimir Lista de Guía";

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm xl:flex-row xl:items-center">
      <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
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
          <option value="PENDING_VALIDATION">Pendiente Validar</option>
          <option value="PAID">Liquidados</option>
          <option value="ADVANCE">Con Anticipo</option>
          <option value="PENDING">Sin Pago</option>
        </select>

        <select
          className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          value={formFilter}
          onChange={(e) => onFormFilterChange(e.target.value)}
        >
          <option value="ALL">Formularios: Todos</option>
          <option value="PENDING">Pendientes (Alerta)</option>
          <option value="COMPLETED">Capturados</option>
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

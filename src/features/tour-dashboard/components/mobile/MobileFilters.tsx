import { Search, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MobileFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (val: string) => void;
  formFilter: string;
  onFormFilterChange: (val: string) => void;
  seatFilter: string;
  onSeatFilterChange: (val: string) => void;
  onDownloadManifest?: () => void;
}

export function MobileFilters({
  searchQuery,
  onSearchChange,
  paymentFilter,
  onPaymentFilterChange,
  formFilter,
  onFormFilterChange,
  seatFilter,
  onSeatFilterChange,
  onDownloadManifest,
}: MobileFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar viajero o teléfono..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-11 rounded-xl border-slate-200 bg-white pl-9"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 font-bold text-slate-400"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <select
          value={paymentFilter}
          onChange={(e) => onPaymentFilterChange(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
        >
          <option value="ALL">Pagos: Todos</option>
          <option value="PAID">Liquidados</option>
          <option value="PARTIAL">Con Saldo</option>
          <option value="UNPAID">Sin Pago</option>
        </select>

        <select
          value={formFilter}
          onChange={(e) => onFormFilterChange(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
        >
          <option value="ALL">Form: Todos</option>
          <option value="COMPLETED">Completos</option>
          <option value="PENDING">Pendientes</option>
        </select>

        <select
          value={seatFilter}
          onChange={(e) => onSeatFilterChange(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
        >
          <option value="ALL">Asientos: Todos</option>
          <option value="ASSIGNED">Con Asiento</option>
          <option value="UNASSIGNED">Sin Asiento</option>
        </select>
      </div>

      {onDownloadManifest && (
        <button
          onClick={onDownloadManifest}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 font-semibold text-indigo-700 transition-all hover:bg-indigo-100 active:scale-95"
        >
          <FileDown className="h-4 w-4" />
          Descargar Lista de Abordaje
        </button>
      )}
    </div>
  );
}

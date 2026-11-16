import { CornerDownRight, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeatCell } from "./traveler-row-cells";

interface PendingSlotRowProps {
  /** Número del lugar dentro del grupo ("Lugar reservado #3"). */
  slotNumber: number;
  hasSeatRight: boolean;
  isAuditMode?: boolean;
  requiresSeats?: boolean;
  isRemoving?: boolean;
  /** Asignar asiento a un lugar pendiente usa el id del titular (aún no hay pasajero). */
  onAssignSeat: () => void;
  onRemove: () => void;
}

/**
 * Lugar apartado que el cliente aún no registra en su Magic Link. Sin «Enviar Link» (petición
 * del usuario, 2026-11-16): el enlace es del grupo y se copia desde la fila del titular.
 */
export function PendingSlotRow({
  slotNumber,
  hasSeatRight,
  isAuditMode,
  requiresSeats,
  isRemoving,
  onAssignSeat,
  onRemove,
}: PendingSlotRowProps) {
  return (
    <tr className="border-b border-slate-100/80 bg-slate-50/40 text-sm opacity-90">
      <td className="px-4 py-3"></td>
      <td className="px-4 py-3 pl-9">
        <div className="flex items-start gap-2.5">
          <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
          <div>
            <span className="text-sm font-normal text-slate-500 italic">
              Acompañante pendiente de registro
            </span>
            <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Lugar reservado #{slotNumber}
            </p>
          </div>
        </div>
      </td>
      {requiresSeats && (
        <td className="px-6 py-3">
          <SeatCell hasSeatRight={hasSeatRight} isAuditMode={isAuditMode} onAssign={onAssignSeat} />
        </td>
      )}
      <td className="px-6 py-3 text-xs text-slate-400">—</td>
      <td className="px-6 py-3 text-xs text-slate-400">—</td>
      <td className="px-6 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Pendiente
        </span>
      </td>
      <td className="px-6 py-3 text-xs text-slate-400 italic">Cubierto por titular</td>
      <td className="flex items-center justify-end gap-2 px-6 py-3 text-right">
        {!isAuditMode && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg border border-slate-200/80 text-slate-400 shadow-xs transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            disabled={isRemoving}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            title="Liberar lugar apartado"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </td>
    </tr>
  );
}

interface AddSlotRowProps {
  colSpan: number;
  isAdding?: boolean;
  /** Lugares libres del tour (si se conoce): sin lugares, el botón se deshabilita. */
  freeSeatsCount?: number;
  onAdd: () => void;
}

/** "+ Agregar lugar al grupo" (solo con el formulario pendiente; lo decide `TravelerGroup`). */
export function AddSlotRow({ colSpan, isAdding, freeSeatsCount, onAdd }: AddSlotRowProps) {
  return (
    <tr className="border-b border-slate-100 bg-slate-50/20">
      <td colSpan={colSpan} className="px-4 py-2.5 pl-9">
        <button
          onClick={onAdd}
          disabled={isAdding || (typeof freeSeatsCount === "number" && freeSeatsCount <= 0)}
          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50/80 hover:text-indigo-700 active:scale-[0.98] disabled:opacity-50"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>+ Agregar lugar al grupo</span>

          {typeof freeSeatsCount === "number" && (
            <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              {freeSeatsCount} libres en tour
            </span>
          )}
        </button>
      </td>
    </tr>
  );
}

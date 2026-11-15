import { CornerDownRight, UserMinus } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import {
  RegistrationStatusBadge,
  RowActionButton,
  SeatCell,
  TransferMenu,
} from "./traveler-row-cells";

type CompanionRowOutput = TitularRowOutput["companions"][number];

interface CompanionRowProps {
  companion: CompanionRowOutput;
  /** Nombre del titular (la fila dice "Acompañante de <nombre>"). */
  titularName: string;
  /** El derecho a asiento es del grupo: lo define el titular. */
  hasSeatRight: boolean;
  isAuditMode?: boolean;
  requiresSeats?: boolean;
  onRowClick: (id: string) => void;
  onAssignSeatClick: (passengerId: string) => void;
  onRemoveClick: () => void;
  onTransferClick: () => void;
}

/** Fila subordinada de un acompañante registrado (el pago lo cubre el titular). */
export function CompanionRow({
  companion,
  titularName,
  hasSeatRight,
  isAuditMode,
  requiresSeats,
  onRowClick,
  onAssignSeatClick,
  onRemoveClick,
  onTransferClick,
}: CompanionRowProps) {
  return (
    <tr
      className="cursor-pointer border-b border-slate-100/80 bg-slate-50/40 text-sm transition-colors hover:bg-slate-100/80"
      onClick={() => onRowClick(companion.id)}
    >
      <td className="px-4 py-3"></td>
      <td className="px-4 py-3 pl-9">
        <div className="flex items-start gap-2.5">
          <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <div>
            <span className="text-sm font-medium text-slate-800">{companion.fullName}</span>
            <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Acompañante de {titularName.split(" ")[0]}
            </p>
          </div>
        </div>
      </td>
      {requiresSeats && (
        <td className="px-6 py-3">
          <SeatCell
            hasSeatRight={hasSeatRight}
            seatLabel={companion.seatLabel}
            isAuditMode={isAuditMode}
            onAssign={() => onAssignSeatClick(companion.id)}
          />
        </td>
      )}
      <td className="px-6 py-3 text-xs text-slate-400">{companion.boardingPoint || "—"}</td>
      <td className="px-6 py-3 font-mono text-xs text-slate-500">{companion.whatsapp || "—"}</td>
      <td className="px-6 py-3">
        <RegistrationStatusBadge status={companion.formStatus} />
      </td>
      <td className="px-6 py-3 text-xs text-slate-400 italic">Cubierto por titular</td>
      <td className="px-6 py-3 text-right whitespace-nowrap">
        <TooltipProvider delayDuration={150}>
          <div className="flex items-center justify-end gap-1.5">
            {!isAuditMode && (
              <RowActionButton
                tooltip="Dar de baja pasajero"
                title="Dar de baja pasajero"
                className="h-9 w-9 rounded-lg border border-slate-200/80 text-slate-400 shadow-xs transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemoveClick();
                }}
              >
                <UserMinus className="h-4 w-4" />
              </RowActionButton>
            )}
            {!isAuditMode && (
              <TransferMenu
                label="Transferir lugar"
                triggerAriaLabel="Más acciones del acompañante"
                onSelect={onTransferClick}
              />
            )}
          </div>
        </TooltipProvider>
      </td>
    </tr>
  );
}

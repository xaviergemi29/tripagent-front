import { TitularRowDTO } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import {
  MapPin,
  Phone,
  FileText,
  Link2,
  WalletCards,
  MoreVertical,
  Trash2,
  Lock,
} from "lucide-react";
import { getInitials } from "@/shared/utils/travelers-helpers";
import { formatCurrency } from "@/shared/utils/currency.util";

interface BookingCardProps {
  titular: TitularRowDTO;
  requiresSeats?: boolean;
  onAssignSeatClick: (passengerId: string) => void;
  onRemoveGhostSlotClick?: (bookingId: string) => void;
  onRowClick?: (id: string) => void;
}

export function BookingCard({
  titular,
  requiresSeats,
  onAssignSeatClick,
  onRowClick,
  onRemoveGhostSlotClick,
}: BookingCardProps) {
  const isPaid =
    titular.paymentStatus === "PAID" || (titular.paidAmount > 0 && titular.balance <= 0);
  const registeredCount = 1 + (titular.companions?.length || 0);
  const missingCount = Math.max(0, titular.groupSize - registeredCount);

  return (
    <div className="space-y-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
      {/* 1. Cabecera */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
            {getInitials(titular.fullName)}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-base leading-tight font-bold text-slate-900">
              {titular.fullName}
            </span>
            <span className="text-xs text-slate-500">
              {titular.groupSize > 1 ? "Titular" : "Viajero Individual"}
            </span>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end">
          {isPaid ? (
            <>
              <span className="rounded border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                LIQUIDADO
              </span>
              <span className="mt-0.5 text-xs text-slate-400">Sin adeudos</span>
            </>
          ) : (
            <>
              <span className="rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                {titular.paidAmount > 0 ? "ABONO PARCIAL" : "SIN PAGO"}
              </span>
              <span className="mt-0.5 text-xs font-bold text-slate-500">
                Debe: {formatCurrency(titular.balance)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. Grid 2 columnas (Asiento y Registro) */}
      {requiresSeats && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
          <div>
            <span className="mb-1 block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Asiento
            </span>
            {titular.seatLabel ? (
              <span className="inline-flex h-6 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 px-2 text-xs font-bold text-indigo-700">
                {titular.seatLabel}
              </span>
            ) : isPaid ? (
              <button
                onClick={() => onAssignSeatClick(titular.id)}
                className="rounded-md border border-indigo-200 bg-white px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
              >
                [ Asignar Asiento ]
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>Requiere anticipo</span>
              </span>
            )}
          </div>
          <div>
            <span className="mb-1 block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Registro
            </span>
            <span
              className={`flex items-center gap-1.5 text-xs font-medium ${
                titular.formStatus === "COMPLETED" ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  titular.formStatus === "COMPLETED" ? "bg-emerald-500" : "animate-pulse bg-red-500"
                }`}
              />
              {titular.formStatus === "COMPLETED" ? "Completo" : "Pendiente"}
            </span>
          </div>
        </div>
      )}

      {/* 3. Punto de Abordaje y Contacto */}
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{titular.boardingPoint || "Por definir"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-mono">{titular.whatsapp}</span>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${titular.whatsapp}`}
              className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
            >
              📞
            </a>
            <a
              href={`https://wa.me/52${titular.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100"
            >
              💬
            </a>
          </div>
        </div>
      </div>

      {/* 4. Acompañantes / Cupos */}
      {titular.groupSize > 1 && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          {titular.companions?.map((comp) => (
            <div
              key={comp.id}
              className="relative flex flex-col gap-1.5 border-l-2 border-indigo-100 pl-3"
            >
              <span className="absolute top-0 -left-[9px] text-xs text-indigo-300">↳</span>
              <div className="flex items-start justify-between">
                <div>
                  <span className="block text-sm font-medium text-slate-800">{comp.fullName}</span>
                  <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Acompañante de {titular.fullName.split(" ")[0]}
                  </span>
                </div>
                {comp.seatLabel ? (
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                    {comp.seatLabel}
                  </span>
                ) : isPaid ? (
                  <button
                    onClick={() => onAssignSeatClick(comp.id)}
                    className="rounded-md border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    [ Asignar ]
                  </button>
                ) : null}
              </div>
              <span className="text-[10px] text-slate-400 italic">Cubierto por titular</span>
            </div>
          ))}

          {/* Slots fantasma alineados con TravelerGroup */}
          {Array.from({ length: missingCount }).map((_, i) => (
            <div
              key={i}
              className="relative flex items-center justify-between border-l-2 border-indigo-50 py-1 pl-3"
            >
              <span className="absolute top-1 -left-[9px] text-xs text-indigo-200">↳</span>
              <div className="flex flex-col">
                <span className="text-xs font-normal text-slate-500 italic">
                  Acompañante pendiente de registro
                </span>
                <span className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Lugar reservado #{registeredCount + i + 1}
                </span>
              </div>
              {onRemoveGhostSlotClick && (
                <button
                  onClick={() => onRemoveGhostSlotClick(titular.bookingId)}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 6. Botonera Inferior */}
      <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900">
            <FileText className="h-4 w-4" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-500 transition-colors hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600">
            <Link2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onRowClick?.(titular.id)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
          >
            <WalletCards className="h-4 w-4" />
          </button>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

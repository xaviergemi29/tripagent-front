import {
  Phone,
  Mail,
  ShieldAlert,
  Activity,
  Pencil,
  Trash2,
  Cake,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInitials, getAvatarColor } from "@/shared/utils/travelers-helpers";
import { formatBirthdateAndAge } from "@/shared/utils/tour-date.util";
import type { TravelerTableRow } from "./TravelersTable"; // Reutilizamos el tipo extendido

interface TravelerCardProps {
  traveler: TravelerTableRow;
  onEdit: (traveler: TravelerTableRow) => void;
  onDelete: (id: string) => void;
  onViewHistory: (id: string) => void;
}

export function TravelerCard({ traveler, onEdit, onDelete, onViewHistory }: TravelerCardProps) {
  const birthInfo = formatBirthdateAndAge(traveler.birthDate);
  const isMinor = birthInfo?.isMinor;

  const hasMedicalNotes =
    traveler.medicalNotes?.trim() && !traveler.medicalNotes.toLowerCase().includes("sin");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* A) Encabezado de la Card */}
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-xs ${getAvatarColor(
            traveler.fullName,
          )}`}
        >
          {getInitials(traveler.fullName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base leading-tight font-semibold text-slate-900">
              {traveler.fullName}
            </h3>
            {isMinor && (
              <span className="rounded-full border border-purple-200 bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800">
                Menor de Edad
              </span>
            )}
          </div>

          {birthInfo ? (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Cake className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>
                {birthInfo.formattedDate} • {birthInfo.age} años
              </span>
            </div>
          ) : (
            <span className="mt-1 block text-xs text-slate-400 italic">
              Sin fecha de nacimiento
            </span>
          )}

          {/* Sub-badge de Fidelidad */}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50/60 px-2 py-1 text-xs text-emerald-700">
            {traveler.tripCount && traveler.tripCount > 0 ? (
              <span className="font-medium">
                {traveler.tripCount}{" "}
                {traveler.tripCount === 1 ? "tour registrado" : "tours registrados"}
                {(traveler.hasNationalTrips || traveler.hasInternationalTrips) && " • "}
                {traveler.hasNationalTrips && "Nacional"}
                {traveler.hasNationalTrips && traveler.hasInternationalTrips && "/"}
                {traveler.hasInternationalTrips && "Extranjero"}
              </span>
            ) : (
              <span className="font-medium text-amber-600">0 viajes (Nuevo)</span>
            )}
          </div>
        </div>
      </div>

      {/* B) Bloque de Contacto y Emergencia */}
      <div className="my-3 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-700">
        <a
          href={traveler.whatsappPhone ? `tel:${traveler.whatsappPhone}` : "#"}
          className={`flex items-center gap-2 transition-colors ${
            traveler.whatsappPhone ? "hover:text-emerald-700" : "pointer-events-none"
          }`}
        >
          <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span className="font-medium">{traveler.whatsappPhone || "Sin teléfono"}</span>
        </a>

        {!isMinor && traveler.email && (
          <a
            href={`mailto:${traveler.email}`}
            className="flex items-center gap-2 truncate transition-colors hover:text-indigo-700"
          >
            <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
            <span className="truncate">{traveler.email}</span>
          </a>
        )}

        <div className="flex items-center gap-1.5 border-t border-slate-200/60 pt-1 font-medium text-rose-800">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-500" />
          <span className="truncate">
            {traveler.emergencyContactName} • {traveler.emergencyContactPhone}
          </span>
        </div>
      </div>

      {/* C) Semáforo de Notas Médicas */}
      <div className="mb-4">
        {hasMedicalNotes ? (
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span>{traveler.medicalNotes}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span>Sin observaciones</span>
          </div>
        )}
      </div>

      {/* D) Botonera de Acciones Inferiores (Ergonomía Táctil: >= 40px height) */}
      <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
        <Button
          variant="outline"
          onClick={() => onViewHistory(traveler.id!)}
          className="h-10 flex-1 rounded-xl border-indigo-200/80 bg-indigo-50/70 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
        >
          <Activity className="mr-1.5 h-3.5 w-3.5" />
          Historial
        </Button>
        <Button
          variant="outline"
          onClick={() => onEdit(traveler)}
          className="h-10 flex-1 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Editar
        </Button>
        <Button
          variant="outline"
          onClick={() => onDelete(traveler.id!)}
          className="h-10 w-10 shrink-0 rounded-xl border-rose-200 bg-rose-50/50 p-0 text-rose-600 hover:bg-rose-100"
          aria-label="Eliminar viajero"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

import { MinorBadge } from "@/components/shared/MinorTravelAlert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPickupTime } from "@/shared/utils/tour-date.util";
import {
  STAFF_PASSENGER_TYPE_LABEL,
  STAFF_SEAT_RIGHT_LABEL,
} from "../constants/staff-share.constants";
import { STAFF_SEAT_RIGHT_STATUS } from "../schemas/staff-share.schema";
import type { StaffShareRow } from "../utils/staff-share-view.util";

function PassengerCard({ row }: { row: StaffShareRow }) {
  const { passenger, point } = row;
  const isPending = passenger.seatRightStatus === STAFF_SEAT_RIGHT_STATUS.PENDING_DEPOSIT;

  return (
    <li className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700"
        aria-label={passenger.seatLabel ? `Asiento ${passenger.seatLabel}` : "Sin asiento"}
      >
        {passenger.seatLabel ?? "—"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold break-words text-slate-900">
          {passenger.fullName}
          {passenger.isTitular && (
            <Badge variant="secondary" className="bg-indigo-50 text-[10px] text-indigo-700">
              Titular
            </Badge>
          )}
          {passenger.isMinor && <MinorBadge />}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {STAFF_PASSENGER_TYPE_LABEL[passenger.passengerType]}
          {point && (
            <>
              {" · "}
              <span className="font-semibold text-slate-700">[{point.code}]</span> {point.location}{" "}
              · {formatPickupTime(point.time)}
            </>
          )}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
          isPending
            ? "border-dashed border-amber-400 bg-amber-50 text-amber-800"
            : "border-emerald-200 bg-emerald-50 text-emerald-800",
        )}
      >
        {STAFF_SEAT_RIGHT_LABEL[passenger.seatRightStatus]}
      </span>
    </li>
  );
}

interface StaffShareListProps {
  seatedRows: StaffShareRow[];
  unseatedRows: StaffShareRow[];
}

/** Lista por asiento (orden natural) y, al final, los pasajeros sin asiento asignado. */
export function StaffShareList({ seatedRows, unseatedRows }: StaffShareListProps) {
  if (seatedRows.length === 0 && unseatedRows.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
        No hay pasajeros que coincidan.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {seatedRows.length > 0 && (
        <ul className="space-y-2" aria-label="Pasajeros con asiento">
          {seatedRows.map((row, index) => (
            <PassengerCard key={`${row.passenger.seatLabel}-${index}`} row={row} />
          ))}
        </ul>
      )}
      {unseatedRows.length > 0 && (
        <section aria-labelledby="staff-unseated-title" className="space-y-2">
          <h2
            id="staff-unseated-title"
            className="text-xs font-bold tracking-wider text-slate-500 uppercase"
          >
            Sin asiento asignado ({unseatedRows.length})
          </h2>
          <ul className="space-y-2">
            {unseatedRows.map((row, index) => (
              <PassengerCard key={`unseated-${index}`} row={row} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

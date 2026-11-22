import { formatPickupTime } from "@/shared/utils/tour-date.util";
import type { BoardingSheet } from "../../utils/boarding-sheet.util";

const CELL = "border border-slate-400 px-2 py-1 align-middle";

/** Tabla por asiento (1..N) con los vacíos como "Disponible" y los pasajeros sin asiento. */
export function ManifestSeatTable({ sheet }: { sheet: BoardingSheet }) {
  return (
    <section aria-labelledby="manifest-seattable-title" className="mb-8">
      <h2 id="manifest-seattable-title" className="mb-2 text-lg font-bold uppercase">
        Lista por asiento
      </h2>
      <table className="w-full border-collapse border border-slate-400 text-xs">
        <thead>
          <tr className="bg-slate-100 text-[10px] tracking-wider uppercase">
            <th scope="col" className={`${CELL} w-8 text-center`}>
              ✔
            </th>
            <th scope="col" className={`${CELL} w-14 text-center`}>
              Asiento
            </th>
            <th scope="col" className={`${CELL} text-left`}>
              Pasajero
            </th>
            <th scope="col" className={`${CELL} text-left`}>
              Punto de abordaje
            </th>
          </tr>
        </thead>
        <tbody>
          {sheet.passengerSeatRows.map((seat) => (
            <tr key={seat.label} className="break-inside-avoid">
              <td className={`${CELL} text-center`}>
                <div className="mx-auto h-3.5 w-3.5 rounded-sm border-2 border-slate-500" />
              </td>
              <td className={`${CELL} text-center font-bold`}>{seat.label}</td>
              <td className={CELL}>
                {seat.status === "STAFF" && <span className="font-semibold">Staff</span>}
                {seat.status === "FREE" && <span className="text-slate-500">Disponible</span>}
                {seat.status === "OCCUPIED" &&
                  (seat.fullName ? (
                    <span className={seat.isTitular ? "font-bold" : "font-medium"}>
                      {seat.fullName}
                    </span>
                  ) : (
                    <span className="text-slate-600 italic">Ocupado</span>
                  ))}
              </td>
              <td className={CELL}>
                {seat.point
                  ? `[${seat.point.code}] ${seat.point.location} · ${formatPickupTime(seat.point.time)}`
                  : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sheet.unseated.length > 0 && (
        <div className="mt-4 break-inside-avoid">
          <h3 className="mb-1 text-sm font-bold uppercase">Sin asiento asignado</h3>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 text-[10px] tracking-wider uppercase">
                <th scope="col" className={`${CELL} text-left`}>
                  Pasajero
                </th>
                <th scope="col" className={`${CELL} text-left`}>
                  Punto de abordaje
                </th>
              </tr>
            </thead>
            <tbody>
              {sheet.unseated.map((passenger) => (
                <tr key={passenger.id}>
                  <td className={CELL}>{passenger.fullName}</td>
                  <td className={CELL}>
                    [{passenger.point.code}] {passenger.point.location} ·{" "}
                    {formatPickupTime(passenger.point.time)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

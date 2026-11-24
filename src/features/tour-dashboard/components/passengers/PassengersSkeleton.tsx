import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROWS = 6;
/** Columnas de la tabla de escritorio (sin contar la de asiento, que depende del tour). */
const TABLE_COLUMNS = 7;

/** Tarjeta de reserva en celular mientras llegan los datos. */
export function BookingCardSkeleton() {
  return (
    <div className="space-y-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

/** Fila del grupo que se está actualizando (baja o cancelación): conserva `data-booking-id`. */
export function SyncingGroupRow({ bookingId, colSpan }: { bookingId: string; colSpan: number }) {
  return (
    <tr data-booking-id={bookingId} aria-busy="true">
      <td colSpan={colSpan} className="px-4 py-3.5">
        <div role="status" aria-label="Actualizando reserva" className="flex items-center gap-4">
          <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="ml-auto h-6 w-24 rounded-full" />
        </div>
      </td>
    </tr>
  );
}

/** Tarjeta del grupo que se está actualizando en celular. */
export function SyncingBookingCard({ bookingId }: { bookingId: string }) {
  return (
    <div data-booking-id={bookingId} aria-busy="true">
      <div role="status" aria-label="Actualizando reserva">
        <BookingCardSkeleton />
      </div>
    </div>
  );
}

/**
 * Primera carga del Centro de Control: encabezado, filtros y la lista de pasajeros con la forma
 * real (tabla en escritorio, tarjetas en celular).
 */
export function DashboardLoadingSkeleton() {
  return (
    <div role="status" aria-label="Cargando pasajeros" className="space-y-4 p-4 md:p-6">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />

      <div className="hidden space-y-4 md:block">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex gap-6 border-b bg-slate-50 px-6 py-4">
            {Array.from({ length: TABLE_COLUMNS }).map((_, index) => (
              <Skeleton key={index} className="h-4 flex-1" />
            ))}
          </div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: SKELETON_ROWS }).map((_, row) => (
              <div key={row} className="flex items-center gap-6 px-6 py-4">
                {Array.from({ length: TABLE_COLUMNS }).map((_, column) => (
                  <Skeleton key={column} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: 4 }).map((_, index) => (
          <BookingCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

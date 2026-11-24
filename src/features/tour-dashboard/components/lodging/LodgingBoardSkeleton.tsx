import { Skeleton } from "@/components/ui/skeleton";

/** Réplica del tablero de hospedaje mientras carga: KPIs, pasajeros sin cama y habitaciones. */
export function LodgingBoardSkeleton() {
  return (
    <div role="status" aria-label="Cargando hospedaje" className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-16 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 lg:col-span-4">
          <Skeleton className="mb-4 h-6 w-48" />
          <Skeleton className="mb-4 h-10 w-full rounded-xl" />
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="mb-2 h-16 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-8">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Marcador de una habitación que se está registrando mientras llegan los datos. */
export function RoomCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Registrando habitación"
      className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

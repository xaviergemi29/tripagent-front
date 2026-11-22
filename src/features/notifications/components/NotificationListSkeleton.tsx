import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROWS = 3;

/** Esqueleto de la lista (imita `NotificationItem`); lo comparten el popover y el drawer. */
export function NotificationListSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-2.5">
      <span className="sr-only">Cargando notificaciones</span>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5"
        >
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { Check, CirclePause } from "lucide-react";
import { cn } from "@/lib/utils";

interface LockItem {
  title: string;
  description: string;
}

const KEPT: LockItem[] = [
  {
    title: "Descarga de documentos PDF",
    description:
      "Puedes descargar en cualquier momento los manifiestos de abordaje y los estados de cuenta de tus viajeros.",
  },
  {
    title: "Acceso en modo lectura",
    description:
      "Consulta sin límite el historial de tus tours, croquis de asientos y el registro de abonos realizados.",
  },
  {
    title: "Tu base de datos de viajeros",
    description:
      "Todos los contactos, teléfonos, datos de emergencia y notas médicas de tus clientes siguen intactos.",
  },
  {
    title: "Enlaces de viajeros activos",
    description:
      "Tus clientes con reservación vigente pueden seguir consultando su estado de cuenta y pase de abordaje.",
  },
];

const PAUSED: LockItem[] = [
  {
    title: "Creación y edición de tours",
    description:
      "No podrás programar nuevas salidas, modificar itinerarios ni registrar abonos nuevos.",
  },
  {
    title: "Reservas rápidas",
    description:
      "Se desactiva el botón para bloquear lugares manualmente desde tu Centro de Control.",
  },
  {
    title: "Ventas desde folletos digitales",
    description:
      "Tus enlaces promocionales dejan de recibir nuevas solicitudes de apartado hasta que actives tu plan.",
  },
  {
    title: "Gestión de asientos",
    description:
      "El mapa de asientos queda en modo consulta (no podrás asignar ni reubicar pasajeros).",
  },
];

function LockColumn({
  title,
  icon,
  items,
  variant,
}: {
  title: string;
  icon: React.ReactNode;
  items: LockItem[];
  variant: "kept" | "paused";
}) {
  return (
    <div className="space-y-3.5 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs">
      <h5
        className={cn(
          "flex items-center gap-2 border-b border-slate-100 pb-2.5 text-sm font-bold",
          variant === "kept" ? "text-emerald-700" : "text-slate-700",
        )}
      >
        {icon}
        {title}
      </h5>
      <ul className="space-y-3 text-xs leading-relaxed text-slate-600">
        {items.map((item) => (
          <li key={item.title} className="flex items-start gap-2">
            <span
              className={cn(
                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                variant === "kept" ? "bg-emerald-500" : "bg-slate-400",
              )}
              aria-hidden
            />
            <span>
              <strong className="font-semibold text-slate-900">{item.title}:</strong>{" "}
              {item.description}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Bloque informativo del "candado suave": qué se conserva y qué se pausa al vencer la prueba. */
export function TrialLockInfo() {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-6 sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800"
          aria-hidden
        >
          ?
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-900">
            ¿Qué pasa si vence mi periodo de prueba?
          </h4>
          <p className="text-sm text-slate-500">
            En TripAgent nunca secuestramos tu información ni afectamos a tus viajeros ya
            confirmados:
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        <LockColumn
          title="Lo que conservas"
          icon={<Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
          items={KEPT}
          variant="kept"
        />
        <LockColumn
          title="Lo que se pausa"
          icon={<CirclePause className="h-4 w-4 text-slate-400" aria-hidden />}
          items={PAUSED}
          variant="paused"
        />
      </div>
    </section>
  );
}

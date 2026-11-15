import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Tarjeta de la pestaña Agencia: ícono, título (con insignia opcional), descripción y campos. */
export function AgencySettingsCard({
  icon: Icon,
  title,
  badge,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  badge?: ReactNode;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h3>
            {badge}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

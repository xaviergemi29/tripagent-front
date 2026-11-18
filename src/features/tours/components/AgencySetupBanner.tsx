"use client";

import Link from "next/link";
import { useAgency } from "@/features/settings/hooks/useAgency";

/**
 * Aviso delgado en `/tours` mientras la agencia no tenga CLABE (OBS-038, decisión del PM,
 * 2026-11-17): no interrumpe al entrar (no es un modal al iniciar sesión) y recuerda el beneficio
 * de completar la agencia. Desaparece en cuanto se guarda la CLABE (Configuración → Agencia o el
 * modal del formulario de tours). Mientras carga o si falla la consulta, no se muestra.
 */
export function AgencySetupBanner() {
  const { data: agency } = useAgency();
  if (!agency || agency.clabeNumber?.trim()) return null;

  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        <span aria-hidden>💡 </span>
        Completa los datos de tu agencia (logo y cuenta para transferencias) para que tus estados de
        cuenta y enlaces de pago salgan listos para cobrar.
      </p>
      <Link
        href="/settings?tab=agency"
        className="shrink-0 self-start rounded-md bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-200 sm:self-auto"
      >
        Configurar
      </Link>
    </div>
  );
}

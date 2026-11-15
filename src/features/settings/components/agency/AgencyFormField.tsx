import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AgencyFormFieldProps extends Omit<React.ComponentProps<"input">, "id"> {
  id: string;
  label: ReactNode;
  icon: LucideIcon;
  registration: UseFormRegisterReturn;
  error?: string;
  /** Texto pequeño a la derecha de la etiqueta (p. ej. "18 dígitos SPEI"). */
  hint?: string;
  /** Prefijo fijo dentro del campo, después del ícono (p. ej. "+52"). */
  prefix?: string;
  inputClassName?: string;
}

/**
 * Campo del formulario de Agencia: etiqueta arriba, ícono a la izquierda y altura táctil de 48 px en
 * celular (40 px desde `sm`). Los errores vienen del schema Zod de la pestaña.
 */
export function AgencyFormField({
  id,
  label,
  icon: Icon,
  registration,
  error,
  hint,
  prefix,
  inputClassName,
  ...inputProps
}: AgencyFormFieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-xs font-semibold text-slate-700 sm:text-sm">
          {label}
        </Label>
        {hint && <span className="shrink-0 text-[11px] font-medium text-slate-400">{hint}</span>}
      </div>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        {prefix && (
          <span
            className="pointer-events-none absolute top-1/2 left-10 -translate-y-1/2 text-sm font-medium text-slate-500"
            aria-hidden
          >
            {prefix}
          </span>
        )}
        <Input
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-12 rounded-xl border-slate-200 bg-white py-3 pr-4 text-sm focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100 sm:h-10 sm:py-2",
            prefix ? "pl-[4.25rem]" : "pl-10",
            inputClassName,
          )}
          {...inputProps}
          {...registration}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

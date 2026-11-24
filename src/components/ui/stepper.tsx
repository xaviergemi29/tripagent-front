import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  title: string;
  icon?: LucideIcon;
}

interface StepperProps {
  steps: StepperStep[];
  /** Índice del paso activo (base 0). */
  currentStep: number;
  /** Pasos ya validados: se dibujan con check. */
  completedSteps: ReadonlySet<number>;
  /** Pasos a los que se puede saltar desde la barra (p. ej. los ya completados). */
  isStepClickable?: (index: number) => boolean;
  onStepClick?: (index: number) => void;
  className?: string;
}

/**
 * Stepper horizontal (wizard): número o ícono de cada paso, su título, check en los completados y
 * resaltado del activo. En celular solo se muestran los círculos y el título del paso activo.
 */
export function Stepper({
  steps,
  currentStep,
  completedSteps,
  isStepClickable = () => false,
  onStepClick,
  className,
}: StepperProps) {
  return (
    <nav aria-label="Progreso" className={className}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.has(index) && !isActive;
          const clickable = !isActive && isStepClickable(index) && Boolean(onStepClick);
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.title} className={cn("flex items-center", !isLast && "flex-1")}>
              <button
                type="button"
                onClick={clickable ? () => onStepClick?.(index) : undefined}
                disabled={!clickable && !isActive}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Paso ${index + 1}: ${step.title}${isCompleted ? " (completado)" : ""}`}
                className={cn(
                  "group flex items-center gap-2 rounded-lg p-1 text-left transition-colors",
                  clickable ? "cursor-pointer hover:bg-slate-100" : "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                    isActive && "border-indigo-600 bg-indigo-600 text-white shadow-sm",
                    isCompleted && "border-indigo-600 bg-indigo-50 text-indigo-700",
                    !isActive && !isCompleted && "border-slate-200 bg-white text-slate-400",
                  )}
                  aria-hidden="true"
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : Icon ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs leading-tight font-semibold sm:text-sm",
                    isActive ? "text-slate-900" : "hidden text-slate-500 md:inline",
                  )}
                >
                  {step.title}
                </span>
              </button>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full",
                    completedSteps.has(index) ? "bg-indigo-600" : "bg-slate-200",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

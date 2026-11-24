import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Atributo con el que `scrollToFirstFormError` localiza el primer mensaje de error del formulario. */
const FORM_ERROR_ATTRIBUTE = "data-form-error";

interface FormFieldErrorProps {
  children: ReactNode;
  className?: string;
}

/** Mensaje de error de un campo del registro; se anuncia a lectores de pantalla y se puede localizar. */
export function FormFieldError({ children, className }: FormFieldErrorProps) {
  return (
    <p
      role="alert"
      {...{ [FORM_ERROR_ATTRIBUTE]: "" }}
      className={cn("text-xs text-red-500", className)}
    >
      {children}
    </p>
  );
}

/**
 * Lleva al viajero al primer error visible (en el titular o en cualquier acompañante) y enfoca su
 * campo. Se llama tras un envío inválido, cuando react-hook-form ya pintó los errores.
 */
export function scrollToFirstFormError(root: ParentNode = document): void {
  requestAnimationFrame(() => {
    const message = root.querySelector<HTMLElement>(`[${FORM_ERROR_ATTRIBUTE}]`);
    if (!message) return;
    // `?.`: entornos sin la API (jsdom) no deben lanzar un error dentro del cuadro de animación.
    message.scrollIntoView?.({ behavior: "smooth", block: "center" });
    const field = message.parentElement?.querySelector<HTMLElement>(
      "input:not([disabled]):not([type=radio]), [role=checkbox]",
    );
    field?.focus({ preventScroll: true });
  });
}

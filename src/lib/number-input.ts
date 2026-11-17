import type { WheelEvent } from "react";

/**
 * Evita que la rueda del mouse cambie un campo `type="number"` enfocado (Chrome, Edge y Firefox lo
 * hacen): al girar, el campo pierde el foco y la rueda desplaza la página como se espera. Hasta el
 * 2026-11-17 el monto de un abono (con `autoFocus`) podía pasar de $1,500.00 a $1,499.97 sin que el
 * operador lo notara. Lo aplica el `Input` de shadcn a todo campo numérico; úsalo en un `<input>`
 * nativo.
 */
export const blurNumberInputOnWheel = (event: WheelEvent<HTMLInputElement>): void => {
  if (event.currentTarget.type === "number" && document.activeElement === event.currentTarget) {
    event.currentTarget.blur();
  }
};

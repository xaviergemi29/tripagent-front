/**
 * Plazo de revisión de los apartados sin pago (regla 13 de `../CLAUDE.md`, decisión del PM): el
 * operador cancela a mano las reservas con más de 48 h sin pago. El sistema no cancela nada; este
 * valor solo cambia el color de la etiqueta "Apartado hace N h sin pago" del Centro de Control.
 */
export const UNPAID_HOLD_REVIEW_HOURS = 48;

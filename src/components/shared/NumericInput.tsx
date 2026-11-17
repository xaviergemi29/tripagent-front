"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

type NumericValue = number | string | null | undefined;

interface NumericInputProps extends Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange"
> {
  /** Valor del formulario (número; un `""` o `null` cuenta como vacío). */
  value: NumericValue;
  /** Recibe el número capturado; con el campo vacío o inválido, `emptyValue`. */
  onValueChange: (value: number) => void;
  /** Número que representa "vacío" en el formulario (por defecto 0). Se dibuja como campo vacío. */
  emptyValue?: number;
}

const toNumber = (value: NumericValue, emptyValue: number): number => {
  if (value === null || value === undefined || value === "") return emptyValue;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? emptyValue : parsed;
};

const toText = (value: NumericValue, emptyValue: number): string => {
  const parsed = toNumber(value, emptyValue);
  return parsed === emptyValue ? "" : String(parsed);
};

/**
 * Campo numérico controlado que conserva el texto que la persona escribe y entrega el número al
 * formulario. Antes cada campo convertía el texto a número en cada tecla: al borrar quedaba `0`,
 * React volvía a escribir "0" en el campo y lo siguiente se pegaba a su derecha ("05"; como
 * 05 == 5, React ya no lo corregía), o, al revés, un "0" escrito desaparecía y no se podía capturar
 * "0.50". El texto solo se reemplaza cuando el valor cambia desde fuera (cargar el tour, "Limpiar").
 */
export function NumericInput({
  value,
  onValueChange,
  emptyValue = 0,
  inputMode = "decimal",
  ...props
}: NumericInputProps) {
  const [text, setText] = useState(() => toText(value, emptyValue));
  const [lastValue, setLastValue] = useState(value);

  // Cambio externo del valor: se muestra, salvo que el texto ya lo represente ("0.50" ⇄ 0.5).
  if (!Object.is(value, lastValue)) {
    setLastValue(value);
    if (toNumber(text, emptyValue) !== toNumber(value, emptyValue)) {
      setText(toText(value, emptyValue));
    }
  }

  return (
    <Input
      {...props}
      type="number"
      inputMode={inputMode}
      value={text}
      onChange={(event) => {
        const nextText = event.target.value;
        const nextValue = toNumber(nextText, emptyValue);
        setText(nextText);
        // Se registra antes de avisar al formulario, para no tomar el propio cambio como externo.
        setLastValue(nextValue);
        onValueChange(nextValue);
      }}
    />
  );
}

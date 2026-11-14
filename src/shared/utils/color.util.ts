export type RgbTuple = [number, number, number];

const HEX_COLOR_REGEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * @description Convierte un color hex (`#RGB` o `#RRGGBB`) a `[r, g, b]` para jsPDF.
 * Si el valor no es válido, usa `fallback`.
 * @example hexToRgb("#4f46e5", "#000000") // [79, 70, 229]
 */
export const hexToRgb = (hex: string | null | undefined, fallback: string): RgbTuple => {
  const match = HEX_COLOR_REGEX.exec(hex?.trim() ?? "") ?? HEX_COLOR_REGEX.exec(fallback);
  const raw = match?.[1] ?? "000000";
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

/**
 * @description Mezcla un color con blanco (`ratio` 0 = color, 1 = blanco). Sirve para fondos
 * suaves derivados de un color de marca (p. ej. fondos de insignias).
 */
export const tintRgb = ([r, g, b]: RgbTuple, ratio: number): RgbTuple => [
  Math.round(r + (255 - r) * ratio),
  Math.round(g + (255 - g) * ratio),
  Math.round(b + (255 - b) * ratio),
];

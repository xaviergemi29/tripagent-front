"use client";

import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SUGGESTED_BRAND_COLORS } from "../../schemas/branding.schema";

interface ColorPickerInputProps {
  id: string;
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  /** Color que se muestra cuando el campo está vacío (color opcional). */
  fallbackColor?: string;
  /** Si se pasa, el campo es opcional y aparece "Quitar" para dejarlo vacío. */
  onClear?: () => void;
  emptyHint?: string;
}

const FULL_HEX = /^#[0-9a-f]{6}$/i;
const SHORT_HEX = /^#[0-9a-f]{3}$/i;

/** El selector nativo solo acepta `#rrggbb`: expande `#rgb` y usa `fallback` mientras se escribe. */
const toNativeColor = (value: string, fallback = "#000000"): string => {
  if (FULL_HEX.test(value)) return value.toLowerCase();
  if (SHORT_HEX.test(value)) {
    return `#${value
      .slice(1)
      .split("")
      .map((c) => c + c)
      .join("")}`.toLowerCase();
  }
  return fallback;
};

/** Color de marca: selector nativo + valor hex editable + paleta de colores sugeridos. */
export function ColorPickerInput({
  id,
  label,
  description,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  fallbackColor,
  onClear,
  emptyHint,
}: ColorPickerInputProps) {
  const isEmpty = value.trim() === "";
  const normalized = toNativeColor(value, fallbackColor);

  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>

      <div className="flex items-center gap-2">
        <label
          className={cn(
            "relative h-10 w-12 shrink-0 cursor-pointer overflow-hidden rounded-md border border-slate-200 shadow-xs",
            disabled && "cursor-not-allowed opacity-60",
          )}
          style={{ backgroundColor: normalized }}
          title="Abrir selector de color"
        >
          <input
            type="color"
            aria-label={`${label}: selector de color`}
            value={normalized}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          maxLength={7}
          spellCheck={false}
          aria-invalid={Boolean(error)}
          className="font-mono uppercase"
          placeholder={onClear ? "Opcional" : "#4F46E5"}
        />
        {onClear && !isEmpty && (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
          >
            Quitar
          </button>
        )}
      </div>
      {isEmpty && emptyHint && <p className="text-xs text-slate-500">{emptyHint}</p>}

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={`Colores sugeridos para ${label}`}
      >
        {SUGGESTED_BRAND_COLORS.map((color) => {
          const isSelected = !isEmpty && normalized === color;
          return (
            <button
              key={color}
              type="button"
              disabled={disabled}
              onClick={() => onChange(color)}
              aria-label={`Usar ${color}`}
              aria-pressed={isSelected}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border border-black/10 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:hover:scale-100",
                isSelected && "ring-2 ring-slate-400 ring-offset-2",
              )}
              style={{ backgroundColor: color }}
            >
              {isSelected && <Check className="h-3.5 w-3.5 text-white" aria-hidden />}
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

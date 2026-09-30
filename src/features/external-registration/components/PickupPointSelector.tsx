"use client";

import { MapPin, Check } from "lucide-react";

export interface PickupPoint {
  id: string;
  name: string;
  reference: string;
  time: string;
}

interface PickupPointSelectorProps {
  points: PickupPoint[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export function PickupPointSelector({ points, value, onChange, error }: PickupPointSelectorProps) {
  return (
    <div className="space-y-2">
      {/* Label del Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">Selecciona tu Punto de Abordaje</label>
        <span className="text-xs font-semibold text-indigo-600">Requerido</span>
      </div>

      {/* Lista de Opciones */}
      <div className="space-y-2" role="radiogroup" aria-label="Puntos de abordaje">
        {points.map((point) => {
          const isSelected = value === point.id;

          return (
            <label
              key={point.id}
              onClick={() => onChange(point.id)}
              className={`group flex min-h-[52px] cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all focus-within:ring-2 focus-within:ring-indigo-600 ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="pickupPoint"
                value={point.id}
                checked={isSelected}
                onChange={() => onChange(point.id)}
                className="sr-only"
              />

              {/* Lado Izquierdo: Radio + Texto */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-white group-hover:border-slate-400"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>

                <div className="flex flex-col">
                  <span
                    className={`text-sm leading-tight ${
                      isSelected ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                    }`}
                  >
                    {point.name}
                  </span>
                  <span className="text-xs text-slate-500">{point.reference}</span>
                </div>
              </div>

              {/* Lado Derecho: Horario y Tag */}
              <div className="flex items-center gap-2 pl-2 text-right">
                <span
                  className={`text-sm ${
                    isSelected ? "font-bold text-indigo-700" : "font-semibold text-slate-600"
                  }`}
                >
                  {point.time}
                </span>
                {isSelected && (
                  <span className="hidden rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 sm:inline-block">
                    Seleccionado
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

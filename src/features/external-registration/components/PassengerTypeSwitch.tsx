"use client";

import { User, Smile } from "lucide-react";
import { PASSENGER_TYPE, type PassengerType } from "@/shared/constants/domain.constants";

export type PassengerCategory = PassengerType;

interface PassengerTypeSwitchProps {
  value: PassengerCategory;
  onChange: (value: PassengerCategory) => void;
}

export function PassengerTypeSwitch({ value, onChange }: PassengerTypeSwitchProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">Categoría de Viajero</label>

      <div className="grid grid-cols-2 rounded-xl border border-slate-200/80 bg-slate-100 p-1">
        {/* Opción Adulto */}
        <button
          type="button"
          onClick={() => onChange(PASSENGER_TYPE.ADULT)}
          className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-xs transition-all duration-200 ${
            value === PASSENGER_TYPE.ADULT
              ? "bg-indigo-600 font-bold text-white shadow-xs"
              : "font-medium text-slate-600 hover:text-slate-900"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Adulto</span>
        </button>

        {/* Opción Niño */}
        <button
          type="button"
          onClick={() => onChange(PASSENGER_TYPE.CHILD)}
          className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-xs transition-all duration-200 ${
            value === PASSENGER_TYPE.CHILD
              ? "bg-indigo-600 font-bold text-white shadow-xs"
              : "font-medium text-slate-600 hover:text-slate-900"
          }`}
        >
          <Smile className="h-4 w-4" />
          <span>Niño</span>
        </button>
      </div>
    </div>
  );
}

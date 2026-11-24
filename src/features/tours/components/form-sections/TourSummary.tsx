"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { ClipboardCheck } from "lucide-react";
import { DEFAULT_CURRENCY, type Currency } from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";
import { formatSpanishLongDate } from "@/shared/utils/tour-date.util";
import type { TourInput } from "../../schemas/tour.schema";

/** Mini resumen antes de "Guardar Tour" (último paso del wizard): lo capturado en los pasos previos. */
export function TourSummary() {
  const { control } = useFormContext<TourInput>();
  const [title, departureDateTime, returnDate, maxCapacity, staffCapacity, price, currency] =
    useWatch({
      control,
      name: [
        "title",
        "departureDateTime",
        "returnDate",
        "maxCapacity",
        "staffCapacity",
        "price",
        "currency",
      ],
    });
  const sellableSeats = Math.max(0, (Number(maxCapacity) || 0) - (Number(staffCapacity) || 0));
  const tourCurrency = (currency || DEFAULT_CURRENCY) as Currency;
  const dates = departureDateTime
    ? `${formatSpanishLongDate(departureDateTime)}${returnDate ? ` – ${formatSpanishLongDate(returnDate)}` : ""}`
    : "Sin fecha";

  const rows: { label: string; value: string }[] = [
    { label: "Tour", value: title?.trim() || "Sin nombre" },
    { label: "Fechas", value: dates },
    { label: "Cupo al público", value: `${sellableSeats} lugares` },
    {
      label: "Precio por pasajero",
      value: formatCurrency(Number(price) || 0, { currency: tourCurrency }),
    },
  ];

  return (
    <section
      aria-labelledby="tour-summary-title"
      className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-5"
    >
      <div className="flex items-center gap-2 text-indigo-700">
        <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
        <h3 id="tour-summary-title" className="text-base font-semibold">
          Resumen antes de guardar
        </h3>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col">
            <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {row.label}
            </dt>
            <dd className="font-medium text-slate-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

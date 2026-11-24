"use client";

import type { ReactNode } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import {
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Compass,
  CreditCard,
  Globe2,
  Info,
  MapPin,
  Bus,
} from "lucide-react";
import {
  CURRENCY,
  DEFAULT_CURRENCY,
  DESTINATION_TYPE,
  type Currency,
  type DestinationType,
} from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";
import { formatPickupTime, formatSpanishLongDate } from "@/shared/utils/tour-date.util";
import type { TourInput } from "../../schemas/tour.schema";
import { getTourDuration } from "../../utils/tour-summary.util";
import { TOUR_FORM_LAST_STEP } from "../../utils/tour-form-steps.util";

const CURRENCY_LABEL: Record<Currency, string> = {
  [CURRENCY.MXN]: "MXN · Peso mexicano",
  [CURRENCY.USD]: "USD · Dólar estadounidense",
};

export interface TourSummaryViewProps {
  title?: string;
  destinationType?: DestinationType;
  departureDate?: string;
  returnDate?: string;
  totalSeats: number;
  staffSeats: number;
  isIndependentAccess: boolean;
  boardingPoints: ReadonlyArray<{ location: string; time: string }>;
  currency: Currency;
  price: number;
  deposit: number;
  paymentMethods: { cash: boolean; transfer: boolean; card: boolean };
  postPaymentInstructions?: string;
  /** Validez real del formulario (`formState.isValid`). */
  isComplete: boolean;
}

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h4 className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-indigo-600 uppercase">
      {icon}
      {children}
    </h4>
  );
}

/** Presentación pura del resumen: recibe todo por props (la validez la decide el contenedor). */
export function TourSummaryView({
  title,
  destinationType,
  departureDate,
  returnDate,
  totalSeats,
  staffSeats,
  isIndependentAccess,
  boardingPoints,
  currency,
  price,
  deposit,
  paymentMethods,
  postPaymentInstructions,
  isComplete,
}: TourSummaryViewProps) {
  const publicSeats = Math.max(0, totalSeats - staffSeats);
  const staffShown = Math.min(staffSeats, totalSeats);
  const publicPct = totalSeats > 0 ? (publicSeats / totalSeats) * 100 : 0;
  const staffPct = totalSeats > 0 ? (staffShown / totalSeats) * 100 : 0;
  const duration = getTourDuration(departureDate, returnDate);
  const isInternational = destinationType === DESTINATION_TYPE.INTERNATIONAL;
  const hasDeposit = deposit > 0;
  const depositPct = price > 0 ? Math.round((deposit / price) * 100) : null;
  const activeMethods = [
    paymentMethods.cash && { label: "Efectivo", Icon: Banknote },
    paymentMethods.transfer && { label: "Transferencia", Icon: Building2 },
    paymentMethods.card && { label: "Tarjeta", Icon: CreditCard },
  ].filter((method) => method !== false);
  const instructions = postPaymentInstructions?.trim();
  const fmt = (value: number) => formatCurrency(value, { currency });

  return (
    <section
      aria-labelledby="tour-summary-title"
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
            aria-hidden="true"
          >
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="tour-summary-title" className="text-lg font-bold text-slate-900">
                Resumen antes de guardar
              </h3>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                • Paso {TOUR_FORM_LAST_STEP + 1} de {TOUR_FORM_LAST_STEP + 1}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Verifica detalladamente los datos de la excursión antes de publicar o confirmar
              modificaciones.
            </p>
          </div>
        </div>
        {isComplete ? (
          <span
            role="status"
            className="flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Todo configurado
          </span>
        ) : (
          <span
            role="status"
            className="flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
          >
            Completando información
          </span>
        )}
      </header>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle icon={<Compass className="h-3.5 w-3.5" aria-hidden="true" />}>
            Información de la excursión
          </SectionTitle>
          <span className="flex w-fit items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {isInternational ? (
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isInternational ? "Destino Internacional" : "Destino Nacional (México)"}
          </span>
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Nombre del tour
            </dt>
            <dd className="mt-0.5 text-base font-extrabold break-words text-slate-900 md:text-lg">
              {title?.trim() ? (
                title.trim()
              ) : (
                <span className="font-normal text-slate-400 italic">Sin nombre asignado</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Fecha y duración
            </dt>
            <dd className="mt-0.5 flex items-start gap-1.5 text-sm font-medium text-slate-800">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              {departureDate ? (
                <span>
                  {formatSpanishLongDate(departureDate)}
                  {duration && <span className="text-slate-500"> · {duration.label}</span>}
                </span>
              ) : (
                <span className="font-normal text-slate-400 italic">Sin fecha de salida</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
          <dt className="flex items-center justify-between text-xs font-bold text-emerald-900 uppercase">
            Cupo al público
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </dt>
          <dd className="mt-1">
            <span className="text-2xl font-black text-emerald-700 md:text-3xl">{publicSeats}</span>{" "}
            <span className="text-sm text-emerald-700">lugares abiertos</span>
            <p className="mt-1 text-[11px] text-emerald-600/90">
              Disponibles en el motor de reservas en línea
            </p>
          </dd>
        </div>
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
          <dt className="flex items-center justify-between text-xs font-bold text-amber-900 uppercase">
            Staff y guías
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold normal-case">
              Bloqueados
            </span>
          </dt>
          <dd className="mt-1">
            <span className="text-2xl font-black text-amber-700 md:text-3xl">{staffSeats}</span>{" "}
            <span className="text-sm text-amber-700">asientos para staff</span>
            <p className="mt-1 text-[11px] text-amber-600/90">
              No disponibles para venta al público
            </p>
          </dd>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-4">
          <dt className="text-xs font-bold text-slate-500 uppercase">Capacidad total</dt>
          <dd className="mt-1">
            <span className="text-2xl font-black text-slate-800 md:text-3xl">{totalSeats}</span>
            <div
              role="img"
              aria-label={`${publicSeats} de ${totalSeats} lugares al público y ${staffShown} para staff`}
              className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-200"
            >
              <div className="bg-emerald-500" style={{ width: `${publicPct}%` }} />
              <div className="bg-amber-400" style={{ width: `${staffPct}%` }} />
            </div>
          </dd>
        </div>
      </dl>

      <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
          <Bus className="h-4 w-4" aria-hidden="true" />
          {isIndependentAccess
            ? "Logística: llegada independiente"
            : `Logística de transporte y puntos de abordaje (${boardingPoints.length} ${boardingPoints.length === 1 ? "parada" : "paradas"})`}
        </h4>
        {isIndependentAccess && (
          <p className="mb-3 text-xs text-slate-600">
            Los viajeros llegan por su cuenta; no hay paradas de transporte. Punto de reunión:
          </p>
        )}
        {boardingPoints.length === 0 ? (
          <p className="text-xs text-slate-500">
            Llegada directa al sitio / Sin paradas intermedias configuradas
          </p>
        ) : (
          <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {boardingPoints.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3"
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {point.location || "Sin ubicación"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatPickupTime(point.time)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase">
              Condiciones financieras y cobranza
            </h4>
            <p className="text-[11px] text-slate-500">
              Esquema de precios, anticipos autorizados y métodos activos
            </p>
          </div>
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            {CURRENCY_LABEL[currency]}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-bold text-slate-500 uppercase">Precio por pasajero</dt>
            <dd className="text-2xl font-black text-slate-900">{fmt(price)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold text-amber-700 uppercase">
              Apartado / anticipo mínimo
            </dt>
            {hasDeposit ? (
              <dd>
                <span className="text-2xl font-black text-amber-600">{fmt(deposit)}</span>
                {depositPct !== null && (
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {depositPct}% para apartar lugar • Saldo ({fmt(Math.max(0, price - deposit))})
                  </p>
                )}
              </dd>
            ) : (
              <dd>
                <span className="text-xl font-bold text-slate-700">Liquidación 100%</span>
                <p className="mt-0.5 text-[11px] text-slate-500">No requiere anticipo parcial</p>
              </dd>
            )}
          </div>
          <div>
            <dt className="text-[11px] font-bold text-slate-500 uppercase">
              Proyección bruta (100% del cupo)
            </dt>
            <dd>
              <span className="text-2xl font-black text-slate-900">{fmt(publicSeats * price)}</span>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {publicSeats} lugares × {fmt(price)}
              </p>
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-3">
          <span className="text-xs text-slate-500">Métodos de pago habilitados para clientes:</span>
          {activeMethods.length === 0 ? (
            <span className="text-xs text-slate-400 italic">Ninguno seleccionado</span>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {activeMethods.map(({ label, Icon }) => (
                <li
                  key={label}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  <Icon className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {instructions && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500 uppercase">
            <h4 className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              Instrucciones post-pago / confirmación
            </h4>
            <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-normal text-slate-400 normal-case">
              Para clientes
            </span>
          </div>
          <p className="rounded-lg border border-slate-200/80 bg-white p-2.5 text-xs whitespace-pre-line text-slate-700 italic">
            {instructions}
          </p>
        </div>
      )}
    </section>
  );
}

/** Resumen antes de "Guardar Tour" (último paso del wizard): solo lee el formulario. */
export function TourSummary() {
  const { control } = useFormContext<TourInput>();
  const { isValid } = useFormState({ control });
  const values = useWatch({ control });

  return (
    <TourSummaryView
      title={values.title}
      destinationType={values.destinationType}
      departureDate={values.departureDateTime}
      returnDate={values.returnDate ?? undefined}
      totalSeats={Number(values.maxCapacity) || 0}
      staffSeats={Number(values.staffCapacity) || 0}
      isIndependentAccess={values.transportModality === "INDEPENDENT_ACCESS"}
      boardingPoints={(values.boardingPoints ?? [])
        .filter((point) => point?.location?.trim())
        .map((point) => ({ location: point.location ?? "", time: point.time ?? "" }))}
      currency={values.currency ?? DEFAULT_CURRENCY}
      price={Number(values.price) || 0}
      deposit={Number(values.depositPerPerson) || 0}
      paymentMethods={{
        cash: Boolean(values.acceptsCash),
        transfer: Boolean(values.acceptsBankTransfer),
        card: Boolean(values.acceptsCreditCard),
      }}
      postPaymentInstructions={values.postPaymentInstructions ?? undefined}
      isComplete={isValid}
    />
  );
}

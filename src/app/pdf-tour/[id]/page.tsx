"use client";

import { useTourManifest } from "@/features/tour-dashboard/hooks/useTourManifest";
import { formatLocalDate } from "@/shared/utils/tour-date.util";
import { useEffect, use } from "react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ManifestPrintView({ params }: PageProps) {
  const { id } = use(params);
  const { data: manifest, isLoading, isError, error } = useTourManifest(id);

  useEffect(() => {
    if (!isLoading && manifest) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, manifest]);

  if (isLoading) return <div className="p-8 font-sans text-slate-500">Generando manifiesto...</div>;
  if (isError || !manifest)
    return (
      <div className="p-8 font-sans text-red-600">
        Error: {error instanceof Error ? error.message : "Desconocido"}
      </div>
    );

  const formattedDate = formatLocalDate(manifest.departureDateTime);

  return (
    <div className="bg-white p-8 font-sans text-sm text-black">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
          .page-break { page-break-before: always; }
        }
      `,
        }}
      />

      <div className="mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-black tracking-tight uppercase">{manifest.tourTitle}</h1>
        <p className="text-lg font-medium text-slate-800">
          Fecha de Salida: <span className="capitalize">{formattedDate}</span>
        </p>
      </div>

      {manifest.boardingPoints.map((point) => (
        <div key={point.id || point.location} className="mb-8 break-inside-avoid">
          <h2 className="mb-4 border border-slate-300 bg-slate-200 p-2 text-lg font-bold uppercase">
            📍 {point.location} - {point.time}
          </h2>

          <table className="w-full border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-50 text-[10px] tracking-wider text-slate-700 uppercase">
                <th className="w-8 border border-slate-400 p-3 text-center">✔️</th>
                <th className="w-12 border border-slate-400 p-3 text-center">Asiento</th>
                <th className="border border-slate-400 p-3 text-left">Pasajero</th>
                <th className="w-1/4 border border-slate-400 p-3 text-left">Notas Médicas</th>
                <th className="w-32 border border-slate-400 p-3 text-center">Cobro en Puerta</th>
                <th className="w-24 border border-slate-400 p-3 text-center">Firma</th>
              </tr>
            </thead>
            <tbody>
              {point.passengers.map((p) => (
                <tr key={p.id} className="border-b border-slate-300">
                  <td className="border border-slate-400 p-3 text-center align-middle">
                    <div className="mx-auto h-5 w-5 rounded-sm border-2 border-slate-500"></div>
                  </td>
                  <td className="border border-slate-400 p-3 text-center align-middle text-base font-bold">
                    {p.seatLabel || "-"}
                  </td>
                  <td className="border border-slate-400 p-3 align-middle">
                    {/* 🚀 Estructura Visual: Sangría, indicador ↳ y contacto de emergencia */}
                    <div className={`flex flex-col ${!p.isTitular ? "pl-6" : ""}`}>
                      <span
                        className={`${p.isTitular ? "text-base font-bold text-slate-900" : "font-medium text-slate-700"}`}
                      >
                        {!p.isTitular && <span className="mr-2 text-slate-400">↳</span>}
                        {p.fullName}
                      </span>
                      {p.emergencyContact && (
                        <span className="mt-1 text-[10px] font-semibold tracking-wider text-slate-600 uppercase">
                          Emergencia: {p.emergencyContact.name} - {p.emergencyContact.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border border-slate-400 p-3 align-middle text-xs font-bold text-red-600 uppercase">
                    {p.medicalNotes}
                  </td>
                  <td className="border border-slate-400 p-3 text-center align-middle">
                    {/* 🚀 Reglas Financieras Visuales Claras */}
                    {p.isTitular ? (
                      p.balance > 0 ? (
                        <span className="text-sm font-black tracking-wide text-red-700 uppercase">
                          Cobrar ${p.balance}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 uppercase">
                          Liquidado
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 uppercase">
                        Cubierto por Titular
                      </span>
                    )}
                  </td>
                  <td className="border border-slate-400 p-3 align-middle"></td>
                </tr>
              ))}

              {/* 🚀 5 Filas en blanco con padding amplio (p-4) para escritura manual */}
              {[...Array(5)].map((_, i) => (
                <tr key={`blank-${i}`} className="bg-slate-50/40">
                  <td className="border border-slate-400 p-4 align-middle">
                    <div className="mx-auto h-5 w-5 rounded-sm border-2 border-slate-400"></div>
                  </td>
                  <td className="border border-slate-400 p-4"></td>
                  <td className="border border-slate-400 p-4"></td>
                  <td className="border border-slate-400 p-4"></td>
                  <td className="border border-slate-400 p-4"></td>
                  <td className="border border-slate-400 p-4"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

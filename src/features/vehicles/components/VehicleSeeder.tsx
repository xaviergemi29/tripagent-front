"use client";

import { Button } from "@/components/ui/button";
import { useCreateVehicle, useVehicles } from "@/features/tour-dashboard/hooks/useTourDashboard";
import { Bus, Plus } from "lucide-react";

// Usamos "AISLE" o null para los pasillos.
const PRESETS = [
  {
    name: "Sprinter (20 Lugares)",
    layoutMap: [
      [
        ["01", "02", "AISLE", "03", "04"],
        ["05", "06", "AISLE", "07", "08"],
        ["09", "10", "AISLE", "11", "12"],
        ["13", "14", "AISLE", "15", "16"],
        ["17", "18", "19", "20", "21"],
      ],
    ],
  },
  {
    name: "Autobús Irizar (40 Lugares)",
    layoutMap: Array.from({ length: 10 }, (_, i) => [
      `${i * 4 + 1}`,
      `${i * 4 + 2}`,
      "AISLE",
      `${i * 4 + 3}`,
      `${i * 4 + 4}`,
    ]),
  },
];

export function VehicleSeeder() {
  const { data: vehicles = [], isLoading } = useVehicles();
  const { mutate: createVehicle, isPending } = useCreateVehicle();

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3 border-b pb-4">
        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
          <Bus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Catálogo de Vehículos</h2>
          <p className="text-sm text-slate-500">
            Administra las plantillas de asientos para los tours.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Lado Izquierdo: Plantillas Disponibles en BD */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Plantillas Instaladas</h3>
          {isLoading ? (
            <p className="text-sm text-slate-400">Cargando...</p>
          ) : vehicles?.length === 0 ? (
            <p className="rounded border border-amber-100 bg-amber-50 p-3 text-sm text-amber-600">
              No hay vehículos en la base de datos.
            </p>
          ) : (
            <ul className="space-y-2">
              {vehicles?.map((v: any) => (
                <li
                  key={v.id}
                  className="flex justify-between rounded border border-slate-100 bg-slate-50 p-3 text-sm font-medium text-slate-600"
                >
                  <span>{v.name}</span>
                  <span className="text-slate-400">{v.layoutMap.length} Filas</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Lado Derecho: Instalador de Presets */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Instalar Presets</h3>
          <div className="space-y-3">
            {PRESETS.map((preset) => {
              // Deshabilitar el botón si ya existe un vehículo con ese nombre en la BD
              const alreadyExists = vehicles.some((v: any) => v.name === preset.name);

              return (
                <Button
                  key={preset.name}
                  variant={alreadyExists ? "secondary" : "outline"}
                  className="w-full justify-start text-sm"
                  disabled={alreadyExists || isPending}
                  onClick={() => createVehicle(preset)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {alreadyExists ? `${preset.name} (Instalado)` : `Instalar ${preset.name}`}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

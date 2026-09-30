"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useVehicles, useCreateVehicle } from "@/features/tour-dashboard/hooks/useTourDashboard";
import { Bus, Plus, LayoutGrid } from "lucide-react";
import { SeatMapPreviewDialog } from "./SeatMapPreviewDialog";

export const PRESETS = [
  {
    name: "Sprinter (20 Lugares)",
    layoutMap: [
      ["01", "02", "03", "AISLE"],
      ["04", "05", "AISLE", "06"],
      ["07", "08", "AISLE", "09"],
      ["10", "11", "AISLE", "12"],
      ["13", "14", "AISLE", "15"],
      ["16", "17", "18", "19"],
    ],
  },
  {
    name: "Autobús Gran Tour (50 Lugares - 2x2)",
    layoutMap: [
      // 12 filas completas de 4 asientos c/u (48 asientos en total)
      ...Array.from({ length: 12 }, (_, i) => [
        String(i * 4 + 1).padStart(2, "0"),
        String(i * 4 + 2).padStart(2, "0"),
        "AISLE",
        String(i * 4 + 3).padStart(2, "0"),
        String(i * 4 + 4).padStart(2, "0"),
      ]),
      // Fila 13: Cierre con los últimos 2 asientos (49 y 50) manteniendo la simetría del grid
      ["49", "50", "AISLE", null, null],
    ],
  },
];

export function FleetTab() {
  const { data: vehicles = [], isLoading } = useVehicles();
  const { mutate: createVehicle, isPending } = useCreateVehicle();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* TARJETA 1: FLOTA ACTIVA */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bus className="h-5 w-5 text-indigo-600" /> Vehículos Instalados
            </CardTitle>
            <CardDescription>Plantillas disponibles para asignar a tus tours.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-400">Cargando flota...</p>
          ) : vehicles?.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-slate-500">
              Aún no tienes vehículos instalados.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {vehicles.map((v: any) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border bg-slate-50 p-3 text-sm"
                >
                  <span className="font-medium text-slate-700">{v.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="rounded border bg-white px-2 py-1 font-mono text-xs text-slate-400">
                      {v.layoutMap.length} Filas
                    </span>
                    <SeatMapPreviewDialog template={v} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* TARJETA 2: INSTALADOR DE PRESETS */}
      <Card className="border-indigo-100 bg-indigo-50/30 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutGrid className="h-5 w-5 text-indigo-600" /> Catálogo de Plantillas
          </CardTitle>
          <CardDescription>
            Instala configuraciones estándar (Presets) en tu agencia con un clic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {PRESETS.map((preset) => {
            const alreadyExists = vehicles.some((v: any) => v.name === preset.name);

            return (
              <div
                key={preset.name}
                className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{preset.name}</p>
                  <p className="text-xs text-slate-500">{preset.layoutMap.length} filas mapeadas</p>
                </div>
                <Button
                  variant={alreadyExists ? "secondary" : "default"}
                  size="sm"
                  disabled={alreadyExists || isPending}
                  onClick={() => createVehicle(preset)}
                  className={
                    alreadyExists
                      ? "bg-slate-100 text-slate-500"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }
                >
                  {alreadyExists ? (
                    "Instalado"
                  ) : (
                    <>
                      <Plus className="mr-1 h-3 w-3" /> Instalar
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

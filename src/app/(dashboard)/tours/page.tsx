import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TourListTable } from "@/features/tours/components/TourListTable";

export default function ToursPage() {
  return (
    <main className="container mx-auto space-y-6 px-4 py-12">
      {/* Header de la página */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tours y Operaciones</h1>
          <p className="mt-1 text-slate-500">
            Gestiona el catálogo de tours y controla la disponibilidad en tiempo real para el agente
            de WhatsApp.
          </p>
        </div>

        <Button asChild>
          <Link href="/tours/new">
            <Plus className="mr-2 h-4 w-4" />
            Crear Nuevo Tour
          </Link>
        </Button>
      </div>

      {/* Instancia de la tabla (Client Component) */}
      <TourListTable />
    </main>
  );
}

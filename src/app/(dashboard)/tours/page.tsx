import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TourListTable } from "@/features/tours/components/TourListTable"


export default function ToursPage() {
  return (
    <main className="container mx-auto py-12 px-4 space-y-6">
      {/* Header de la página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Tours y Operaciones
          </h1>
          <p className="text-slate-500 mt-1">
            Gestiona el catálogo de tours y controla la disponibilidad en tiempo real para el agente de WhatsApp.
          </p>
        </div>
        
        <Button asChild>
          <Link href="/tours/new">
            <Plus className="w-4 h-4 mr-2" />
            Crear Nuevo Tour
          </Link>
        </Button>
      </div>

      {/* Instancia de la tabla (Client Component) */}
      <TourListTable />
    </main>
  )
}
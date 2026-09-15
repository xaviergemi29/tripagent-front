import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TourReservationsTable } from "@/features/tours/components/TourReservationsTable";

// Next.js App Router tipa los params automáticamente en las páginas
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TourReservationsPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <main className="container mx-auto space-y-6 px-4 py-12">
      {/* 1. Header con navegación limpia */}
      <div className="flex flex-col gap-4">
        <Link
          href="/tours"
          className="flex w-fit items-center text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Operaciones
        </Link>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Pasajeros Confirmados
          </h1>
          <p className="mt-1 text-slate-500">
            Gestiona los lugares reservados y el estado de pago de los leads procesados por la IA.
          </p>
        </div>
      </div>

      {/* 2. Boundary del Client Component */}
      {/* Pasamos el ID directamente desde el servidor al componente cliente */}
      <TourReservationsTable tourId={id} />
    </main>
  );
}

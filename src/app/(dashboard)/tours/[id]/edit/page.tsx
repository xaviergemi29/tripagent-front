"use client" // Necesitamos "use client" porque consumiremos un hook de TanStack Query

import { TourForm } from "@/features/tours/components/TourForm"
import { useTourById } from "@/features/tours/hooks/useTours"
import { useParams } from "next/navigation"

export default function EditTourPage() {
    const params = useParams<{ id: string }>();
    const { data: tour, isLoading } = useTourById(params.id);

    if (isLoading) {
        return <div className="p-10 animate-pulse text-center">Cargando datos del tour...</div>;
    }

    if (!tour) {
        return <div className="p-10 text-destructive text-center">Tour no encontrado.</div>;
    }

    return (
        <main className="container mx-auto py-12 px-4 flex justify-center">
            <div className="w-full max-w-2xl space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        Editar Tour: {tour.title}
                    </h2>
                </div>
                <TourForm initialData={tour} tourId={params.id} />
            </div>
        </main>
    )
}
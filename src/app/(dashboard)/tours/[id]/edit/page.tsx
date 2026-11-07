"use client";

import { Button } from "@/components/ui/button";
import { TourForm } from "@/features/tours/components/TourForm";
import { useTourById } from "@/features/tours/hooks/useTours";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EditTourPage() {
  const params = useParams<{ id: string }>();
  const { data: tour, isLoading } = useTourById(params.id);

  if (isLoading) {
    return <div className="animate-pulse p-10 text-center">Cargando datos del tour...</div>;
  }

  if (!tour) {
    return <div className="text-destructive p-10 text-center">Tour no encontrado.</div>;
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 text-slate-500 hover:text-slate-900"
          >
            <Link href="/tours">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver a Lista de Tours
            </Link>
          </Button>
          <span className="mx-2 text-slate-300">/</span>
        </div>
      </div>

      <div className="container mx-auto flex justify-center px-4 py-6">
        <div className="w-full max-w-3xl space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Editar Tour: {tour.title}
            </h2>
          </div>
          <TourForm tour={tour} />
        </div>
      </div>
    </>
  );
}

import { Button } from "@/components/ui/button";
import { TourForm } from "@/features/tours/components/TourForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewTourPage() {
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nuevo Tour</h1>
            <p className="mt-1 text-slate-500">
              Organiza los detalles logísticos de tu tour, políticas de abordaje y las reglas de
              pago para tus clientes.
            </p>
          </div>

          <TourForm />
        </div>
      </div>
    </>
  );
}

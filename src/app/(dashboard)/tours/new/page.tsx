import { TourForm } from "@/features/tours/components/TourForm";

export default function NewTourPage() {
  return (
    <main className="container mx-auto flex justify-center px-4 py-12">
      <div className="w-full max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nuevo Tour</h1>
          <p className="mt-1 text-slate-500">
            Organiza los detalles logísticos de tu tour, políticas de abordaje y las reglas de pago
            para tus clientes.
          </p>
        </div>

        <TourForm />
      </div>
    </main>
  );
}

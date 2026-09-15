import { TourForm } from "@/features/tours/components/TourForm"

export default function NewTourPage() {
  return (
    <main className="container mx-auto py-12 px-4 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Nuevo Tour
          </h1>
          <p className="text-slate-500 mt-1">
            Organiza los detalles de tu excursión y las reglas de pago para tus clientes..
          </p>
        </div>

        {/* Formulario aislado por dominio */}
        <TourForm />
      </div>
    </main>
  )
}
import { AlertTriangle } from "lucide-react";

/** Pantalla amable cuando el enlace no se pudo cargar (429, 500, sin conexión). Server-safe. */
export function StaffShareMessageScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf8ff] p-4 text-center">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Servicio no disponible</h1>
        <p className="text-sm leading-relaxed text-slate-500">{message}</p>
      </div>
      <p className="mt-6 text-xs font-medium text-slate-400">Potenciado por TripAgent</p>
    </div>
  );
}

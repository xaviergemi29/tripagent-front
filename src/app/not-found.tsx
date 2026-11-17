import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * 404 de la app (2026-11-16): `notFound()` del folleto (`/p/[id]`: tour cancelado, borrado o enlace
 * mal copiado) y cualquier ruta inexistente. Antes se veía la página genérica de Next en inglés.
 * La ve sobre todo el cliente final, así que no asume sesión: el enlace al panel es secundario.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf8ff] p-4 text-center">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <Compass className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">Este enlace no está disponible</h1>
          <p className="text-sm leading-relaxed text-slate-500">
            Es posible que el enlace esté incompleto o que el viaje ya no esté disponible. Si te lo
            compartió una agencia, pídele uno nuevo por WhatsApp.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          ¿Trabajas en una agencia?{" "}
          <Link href="/tours" className="font-semibold text-indigo-600 hover:underline">
            Ir al panel
          </Link>
        </p>
      </div>
      <p className="mt-6 text-xs font-medium text-slate-400">Potenciado por TripAgent</p>
    </div>
  );
}

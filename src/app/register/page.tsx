import { TourRegistrationView } from "@/features/external-registration/components/TourRegistrationView";
import { AlertTriangle, Compass, Unlink, HelpCircle } from "lucide-react";
import { BookingSuccessView } from "@/features/external-registration/components/BookingSuccessView";
import { PartialPaymentView } from "@/features/external-registration/components/PartialPaymentView";

interface PageProps {
  searchParams: Promise<{ token: string }>;
}

async function validateTokenOnServer(token: string): Promise<any> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/magic-tokens/${token}/validate`, {
      cache: "no-store",
    });
    return await res.json();
  } catch (e) {
    return {
      isValid: false,
      error: { code: "SERVER_ERROR", message: "Error de conexión con el servidor." },
    };
  }
}

const FlowViews = {
  PENDING_REGISTRATION: TourRegistrationView,
  PENDING_PAYMENT: BookingSuccessView,
  PARTIAL_PAYMENT: PartialPaymentView,
  PAID: PartialPaymentView,

  SEAT_SELECTION: () => (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div className="space-y-3 text-center">
        <h2 className="text-xl font-bold text-slate-800">🗺️ Selección de Asientos</h2>
        <p className="text-sm text-slate-500">Módulo en construcción...</p>
      </div>
    </div>
  ),
} as const;

export default async function RegistroPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidScreen message="Faltan credenciales de acceso en la URL." />;
  }

  const validation = await validateTokenOnServer(token);

  // 1. Manejo de Errores y No Encontrados
  // (El Magic Link no vence por decisión del PM: no existe estado de enlace expirado.)
  if (!validation.isValid) {
    const errorCode = validation.error?.code?.toUpperCase() || "";

    // Verificamos si es un error de token no encontrado o corrupto
    if (errorCode.includes("NOT_FOUND")) {
      return <NotFoundLinkView />;
    }

    // Errores duros (Token malformado genérico, error de servidor, etc.)
    return (
      <InvalidScreen
        message={
          validation.error?.message || "El enlace ingresado no es válido o ha sido dado de baja."
        }
      />
    );
  }

  // 2. Renderizado de Vistas Válidas
  const CurrentView = FlowViews[validation.flowState as keyof typeof FlowViews];

  if (!CurrentView) {
    return (
      <InvalidScreen
        title="Estado desconocido"
        message={`El viaje se encuentra en un estado no soportado (${validation.flowState}). Contacta a soporte.`}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4">
      {validation.flowState === "PENDING_REGISTRATION" && (
        <div className="mx-auto mb-6 max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wider text-indigo-600 uppercase">
            Registro de Viajeros
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{validation.data?.tour?.title}</h1>
        </div>
      )}

      <CurrentView {...validation.data} token={token} />
    </main>
  );
}

// ============================================================================
// COMPONENTES DE ERROR SEPARADOS POR RESPONSABILIDAD
// ============================================================================

/**
 * Nueva vista para enlace no encontrado o corrupto (Neutral, Mobile-First)
 */
function NotFoundLinkView() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50/60 p-4 font-sans sm:p-6">
      {/* Header Minimalista Neutral */}
      <header className="mx-auto flex w-full max-w-md items-center gap-3 pt-2 pb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm leading-tight font-bold text-slate-900">Registro de Viajeros</h1>
          <p className="text-xs font-medium text-slate-500">Verificación de Reserva</p>
        </div>
      </header>

      {/* Tarjeta Central */}
      <main className="mx-auto my-auto w-full max-w-md">
        <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-xl shadow-slate-200/50 sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100/80 bg-indigo-50 text-indigo-600 shadow-xs">
            <Unlink className="h-8 w-8 stroke-[2.2]" />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Enlace no disponible
            </h2>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-600">
              No pudimos identificar la reservación asociada a este enlace. Es posible que esté
              incompleto, se haya copiado con algún carácter faltante o no corresponda a un registro
              activo.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/90 p-4 text-left">
            <div className="mt-0.5 shrink-0 text-indigo-600">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              <strong className="mb-0.5 block font-semibold text-slate-900">
                ¿Qué puedes hacer?
              </strong>
              Contacta directamente a la agencia o asesor de viajes que te compartió este enlace a
              través de tu chat original para solicitar el acceso actualizado a tu registro.
            </div>
          </div>
        </div>
      </main>

      {/* Footer Discreto */}
      <footer className="mx-auto w-full max-w-md py-4 text-center">
        <p className="text-xs font-medium text-slate-400">
          TripAgent • Plataforma de Registro de Viajeros
        </p>
      </footer>
    </div>
  );
}

/**
 * Vista genérica para errores duros (Tokens malformados, error de servidor, etc)
 */
function InvalidScreen({
  title = "Acceso Denegado",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="animate-in zoom-in-95 w-full max-w-md space-y-5 rounded-2xl border bg-white p-8 text-center shadow-sm duration-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm leading-relaxed text-slate-500">{message}</p>
        </div>
      </div>
    </div>
  );
}

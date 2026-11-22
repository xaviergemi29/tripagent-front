import type { ComponentType } from "react";
import type { Metadata } from "next";
import { API_BASE_URL } from "@/lib/api-config";
import { TourRegistrationView } from "@/features/external-registration/components/TourRegistrationView";
import { AlertTriangle, Compass, Unlink, HelpCircle } from "lucide-react";
import { CancelledBookingView } from "@/features/external-registration/components/CancelledBookingView";
import { BookingSuccessView } from "@/features/external-registration/components/BookingSuccessView";
import { PartialPaymentView } from "@/features/external-registration/components/PartialPaymentView";
import { PaidBookingView } from "@/features/external-registration/components/PaidBookingView";
import type { CancelledBookingData } from "@/features/external-registration/components/CancelledBookingView";
import {
  describeValidationError,
  type MagicLinkValidation,
} from "@/features/external-registration/utils/magic-link-validation";

// Enlace privado del cliente (Magic Link): título neutro y sin indexar.
export const metadata: Metadata = {
  title: "Tu reservación",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ token: string }>;
}

async function validateTokenOnServer(token: string): Promise<MagicLinkValidation> {
  try {
    const res = await fetch(`${API_BASE_URL}/magic-tokens/${token}/validate`, {
      cache: "no-store",
    });
    return (await res.json()) as MagicLinkValidation;
  } catch {
    // Sin conexión o respuesta que no es JSON (p. ej. un 502 del proxy): igual que una falla nuestra.
    return { isValid: false, error: { code: "SERVER_ERROR" } };
  }
}

const FlowViews = {
  PENDING_REGISTRATION: TourRegistrationView,
  PENDING_PAYMENT: BookingSuccessView,
  PARTIAL_PAYMENT: PartialPaymentView,
  PAID: PaidBookingView,

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
    const { kind, message } = describeValidationError(validation);

    // Token inexistente o corrupto
    if (kind === "NOT_FOUND") return <NotFoundLinkView />;

    // Falla nuestra (o sin conexión): el enlace puede estar bien, se pide reintentar.
    if (kind === "SERVER_ERROR") {
      return <InvalidScreen title="Servicio no disponible" message={message} />;
    }

    // Otros rechazos (estado no soportado, límite de intentos, etc.)
    return <InvalidScreen message={message} />;
  }

  // Marca de la agencia: la API la manda en `meta` para todos los estados (incluido CANCELLED).
  const agencyBrand = validation.meta?.agency ?? null;

  // 2. Reserva cancelada: no tiene vista de flujo, pero sí la marca de la agencia.
  if (validation.flowState === "CANCELLED") {
    return (
      <CancelledBookingView
        agency={agencyBrand}
        data={(validation.data ?? null) as CancelledBookingData | null}
      />
    );
  }

  // 3. Renderizado de Vistas Válidas
  const CurrentView = FlowViews[validation.flowState as keyof typeof FlowViews];

  if (!CurrentView) {
    return (
      <InvalidScreen
        title="Estado desconocido"
        message={`El viaje se encuentra en un estado no soportado (${validation.flowState}). Contacta a soporte.`}
      />
    );
  }

  // Cada vista aporta su propio cascarón (PublicBookingLayout: fondo, encabezado y pie comunes).
  // El `data` de cada `flowState` es el contrato de su vista (cada una tipa sus props).
  const View = CurrentView as ComponentType<Record<string, unknown>>;
  return (
    <View
      {...validation.data}
      token={token}
      agencyLogoPath={agencyBrand?.logoPath ?? null}
      agencyPhone={agencyBrand?.phone ?? null}
      agencyAddress={agencyBrand?.address ?? null}
    />
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

import { TourRegistrationView } from "@/features/external-registration/components/TourRegistrationView";
import { AlertTriangle, Clock, Compass, Unlink, HelpCircle } from "lucide-react";
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

  // 1. Manejo de Errores, Expiración y No Encontrados
  if (!validation.isValid) {
    const errorCode = validation.error?.code?.toUpperCase() || "";

    // Verificamos si es un error de expiración
    if (errorCode.includes("EXPIRED") || errorCode.includes("CADUCADO")) {
      return (
        <ExpiredLinkView
          agencyName={validation.data?.agency?.name || "Agencia de Viajes"}
          agencyPhone={validation.data?.agencyPhone || validation.data?.agency?.whatsapp}
        />
      );
    }

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
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
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
 * Vista de enlace expirado (Mobile-First, Empática y Orientada a Conversión)
 */
function ExpiredLinkView({
  agencyName = "Registro de Viajeros",
  agencyPhone,
}: {
  agencyName?: string;
  agencyPhone?: string;
}) {
  const message = encodeURIComponent(
    "Hola, mi enlace de registro para el tour ha vencido. ¿Podrían apoyarme con un nuevo enlace para revisar disponibilidad?",
  );

  const whatsappUrl = agencyPhone
    ? `https://wa.me/${agencyPhone.replace(/\D/g, "")}?text=${message}`
    : `https://wa.me/?text=${message}`;

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50/60 p-4 font-sans sm:p-6">
      {/* Header Minimalista */}
      <header className="mx-auto flex w-full max-w-md items-center gap-3 pt-2 pb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm leading-tight font-bold text-slate-900">{agencyName}</h1>
          <p className="text-xs font-medium text-slate-500">Registro de Viajeros</p>
        </div>
      </header>

      {/* Tarjeta Central de Contenido */}
      <main className="mx-auto my-auto w-full max-w-md">
        <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-xl shadow-slate-200/50 sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-100/80 bg-amber-50 text-amber-600 shadow-xs">
            <Clock className="h-8 w-8 stroke-[2.2]" />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Tu enlace de registro ha expirado
            </h2>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-600">
              Por seguridad y para proteger los lugares disponibles, los enlaces de registro tienen
              una vigencia de <span className="font-semibold text-slate-800">24 horas</span>.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/90 p-4 text-left">
            <span className="shrink-0 text-lg leading-none select-none">💡</span>
            <div className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              <strong className="mb-0.5 block font-semibold text-slate-900">
                ¡No te preocupes!
              </strong>
              Puedes pedir un nuevo enlace directo a la agencia para revisar si aún hay cupo y
              apartar tu aventura.
            </div>
          </div>

          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-13 min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] text-sm font-semibold text-white shadow-md shadow-emerald-600/15 transition hover:bg-[#20bd5a] active:scale-[0.98] sm:text-base"
            >
              <svg
                className="h-5 w-5 shrink-0 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.35.49 1.199.533 1.286.044.087.073.189.014.305-.058.115-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.102-.115.434-.506.549-.68.116-.173.232-.145.39-.087s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z" />
              </svg>
              <span>Pedir nuevo enlace por WhatsApp</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer Discreto */}
      <footer className="mx-auto w-full max-w-md py-4 text-center">
        <p className="text-xs font-medium text-slate-400">
          {agencyName === "Registro de Viajeros"
            ? "TripAgent • Plataforma de Registro"
            : `${agencyName} • Agencia de Viajes`}
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

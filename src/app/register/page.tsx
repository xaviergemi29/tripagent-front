import { TourRegistrationView } from "@/features/external-registration/components/TourRegistrationView";
import { AlertTriangle, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{ token?: string; group_id?: string }>;
}

async function validateTokenOnServer(token: string) {
  try {
    const res = await fetch(`http://localhost:3001/api/magic-tokens/${token}/validate`, {
      cache: "no-store",
    });
    return await res.json();
  } catch (e) {
    return { isValid: false, error: { message: "Error de conexión con el servidor." } };
  }
}

export default async function RegistroPage({ searchParams }: PageProps) {
  const { token, group_id } = await searchParams;

  if (!token) {
    return (
      <ExpiredOrInvalidScreen
        type="INVALID"
        title="Enlace inválido"
        message="Faltan credenciales de acceso en la URL."
      />
    );
  }

  const validation = await validateTokenOnServer(token);

  if (!validation.isValid) {
    const errorMessage = validation.error?.message || "";
    const isExpired =
      errorMessage.toLowerCase().includes("expirado") ||
      errorMessage.toLowerCase().includes("caducado");

    return (
      <ExpiredOrInvalidScreen
        type={isExpired ? "EXPIRED" : "INVALID"}
        title={isExpired ? "Este enlace ha expirado" : "Acceso Denegado"}
        message={
          isExpired
            ? "Este enlace ha caducado por motivos de seguridad y disponibilidad de lugares. Contacta a tu agencia para solicitar un nuevo enlace."
            : errorMessage || "El token ingresado no es válido."
        }
        agencyPhone={validation.data?.agencyPhone}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <p className="text-sm font-semibold tracking-wider text-indigo-600 uppercase">
          Registro de Viajeros
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{validation.data?.tour?.title}</h1>
      </div>

      <TourRegistrationView
        token={token}
        initialGroupId={group_id}
        boardingPoints={validation.data?.tour?.boardingPoints || []}
      />
    </main>
  );
}

function ExpiredOrInvalidScreen({
  type,
  title,
  message,
  agencyPhone,
}: {
  type: "EXPIRED" | "INVALID";
  title: string;
  message: string;
  agencyPhone?: string;
}) {
  const isExpired = type === "EXPIRED";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="animate-in zoom-in-95 w-full max-w-md space-y-5 rounded-2xl border bg-white p-8 text-center shadow-sm duration-200">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            isExpired ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"
          }`}
        >
          {isExpired ? <Clock className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm leading-relaxed text-slate-500">{message}</p>
        </div>

        {isExpired && (
          <div className="pt-2">
            {agencyPhone ? (
              <a
                href={`https://wa.me/${agencyPhone.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, mi enlace de registro ha expirado. ¿Me podrían ayudar a renovarlo?")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="h-11 w-full bg-emerald-600 font-bold text-white hover:bg-emerald-700">
                  <Phone className="mr-2 h-4 w-4" /> Contactar a mi agencia por WhatsApp
                </Button>
              </a>
            ) : (
              <div className="rounded-lg border bg-slate-50 p-3 text-xs font-medium text-slate-500">
                Contacta a tu agente de viajes para que te genere una nueva reserva.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { TourRegistrationView } from "@/features/external-registration/components/TourRegistrationView";
import { AlertTriangle } from "lucide-react";

interface PageProps {
    searchParams: Promise<{ token?: string; group_id?: string }>
}

async function validateTokenOnServer(token: string) {
    try {
        const res = await fetch(`http://localhost:3001/api/magic-tokens/${token}/validate`, {
            // Aseguramos que Next.js no cachee peticiones viejas (los cupos pueden llenarse en tiempo real)
            cache: 'no-store'
        });
        return await res.json();
    } catch (e) {
        return { isValid: false, error: { message: "Error de conexión con el servidor." } };
    }
}

export default async function RegistroPage({ searchParams }: PageProps) {
    const { token, group_id } = await searchParams;

    if (!token) return <ErrorScreen message="Enlace inválido. Faltan credenciales de acceso en la URL." />;

    // ✅ Validación puramente HTTP desde el Frontend al Backend
    const validation = await validateTokenOnServer(token);
    console.log("validation", validation)
    if (!validation.isValid) {
        return (
            <ErrorScreen
                title="Acceso Denegado"
                message={validation.error?.message || "El token es inválido."}
            />
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 py-8 px-4 sm:py-12">
            <div className="max-w-2xl mx-auto mb-6 text-center">
                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Registro de Viajeros</p>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">{validation.data?.tour?.title}</h1>
            </div>

            <TourRegistrationView token={token} initialGroupId={group_id} boardingPoints={validation.data?.tour?.boardingPoints || []} />
        </main>
    )
}

function ErrorScreen({ title = "Algo salió mal", message }: { title?: string, message: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border text-center space-y-4">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <p className="text-slate-500">{message}</p>
            </div>
        </div>
    )
}
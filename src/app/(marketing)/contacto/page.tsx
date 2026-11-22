import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { LegalHeader } from "@/features/legal/components/LegalHeader";
import { LegalFooter } from "@/features/legal/components/LegalFooter";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { SUPPORT_EMAIL, buildSupportWhatsAppUrl } from "@/lib/support-config";

export const metadata: Metadata = {
  title: { absolute: "Contacto | TripAgent MX" },
  description: "Soporte de TripAgent MX para agencias de viajes en México.",
};

/** Canales de soporte de TripAgent (enlace "Contacto" del pie de /registro). */
export default function ContactoPage() {
  const whatsappUrl = buildSupportWhatsAppUrl("Hola, necesito ayuda con TripAgent");

  return (
    <>
      <LegalHeader active="contacto" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            Soporte y Contacto
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Soporte humano en México para agencias y coordinadores de viaje.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-colors hover:border-[#3525cd]/40"
          >
            <Mail className="h-6 w-6 text-[#3525cd]" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-slate-900">Correo de soporte</p>
            <p className="mt-1 text-sm break-all text-[#3525cd]">{SUPPORT_EMAIL}</p>
          </a>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-colors hover:border-emerald-300"
            >
              <WhatsAppIcon className="h-6 w-6 text-emerald-600" />
              <p className="mt-3 text-sm font-bold text-slate-900">WhatsApp</p>
              <p className="mt-1 text-sm text-emerald-700">Escríbenos por WhatsApp</p>
            </a>
          )}
        </div>

        <p className="text-sm text-slate-600">
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/registro?plan=todo-incluido"
            className="font-semibold text-[#3525cd] hover:underline"
          >
            Crea tu cuenta gratis
          </Link>
          .
        </p>
      </main>
      <LegalFooter />
    </>
  );
}

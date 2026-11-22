import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeader } from "@/features/legal/components/LegalHeader";
import { LegalFooter } from "@/features/legal/components/LegalFooter";
import { LegalSupportCard } from "@/features/legal/components/LegalSupportCard";
import { SUPPORT_EMAIL } from "@/lib/support-config";

export const metadata: Metadata = {
  title: { absolute: "Aviso de Privacidad | TripAgent MX" },
  description: "Aviso de privacidad de TripAgent MX para agencias de viajes en México.",
};

/**
 * Página corta para que los enlaces de /registro y /terminos no den 404 (2026-11-22). El texto
 * completo del aviso está pendiente (sección G de ../CLAUDE.md): aquí solo se repite lo que ya
 * afirman los Términos y el canal para ejercer derechos.
 */
export default function PrivacidadPage() {
  return (
    <>
      <LegalHeader active="privacidad" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            🇲🇽 Marco Legal · México
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            Aviso de Privacidad
          </h1>
        </div>

        <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm sm:p-7">
          <p>
            Estamos preparando la versión completa de nuestro Aviso de Privacidad. Mientras tanto,
            estos son los principios con los que tratamos la información:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los
              Particulares (LFPDPPP), cada agencia es la titular y Responsable del Tratamiento de
              los datos de sus pasajeros; TripAgent funge como Encargado Tecnológico.
            </li>
            <li>
              Jamás venderemos, rentaremos ni cederemos las listas de clientes de tu agencia ni las
              usaremos para promocionar viajes de terceros.
            </li>
            <li>
              Para cualquier solicitud sobre tus datos personales (acceso, rectificación,
              cancelación u oposición) escríbenos a{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold text-[#3525cd] hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </li>
          </ul>
          <p>
            Consulta también nuestros{" "}
            <Link href="/terminos" className="font-semibold text-[#3525cd] hover:underline">
              Términos y Condiciones de Servicio
            </Link>
            .
          </p>
        </section>

        <LegalSupportCard />
      </main>
      <LegalFooter />
    </>
  );
}

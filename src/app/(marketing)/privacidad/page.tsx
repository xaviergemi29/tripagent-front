import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { LegalHeader } from "@/features/legal/components/LegalHeader";
import { LegalFooter } from "@/features/legal/components/LegalFooter";
import { LegalSupportCard } from "@/features/legal/components/LegalSupportCard";
import { SUPPORT_EMAIL, TRIPAGENT_ADDRESS, TRIPAGENT_LEGAL_NAME } from "@/lib/support-config";

export const metadata: Metadata = {
  title: { absolute: "Aviso de Privacidad | TripAgent MX" },
  description:
    "Aviso de privacidad integral de TripAgent MX conforme a la LFPDPPP 2025: datos que tratamos, finalidades y cómo ejercer tus derechos ARCO.",
};

const LAST_UPDATED = "Noviembre 2026";

/** Tarjeta de un punto del aviso, con ancla para enlazarlo desde los avisos simplificados. */
function NoticeSection({
  id,
  number,
  title,
  children,
}: {
  id?: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`privacidad-${number}`}
      className="scroll-mt-24 space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm sm:p-7"
    >
      <p className="text-[11px] font-bold tracking-wider text-[#3525cd] uppercase">
        Punto {number}
      </p>
      <h2 id={`privacidad-${number}`} className="text-lg font-extrabold text-slate-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

const emailLink = (
  <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[#3525cd] hover:underline">
    {SUPPORT_EMAIL}
  </a>
);

/**
 * Aviso de privacidad integral de TripAgent (LFPDPPP publicada en el DOF el 20-03-2025; PM,
 * 2026-11-22). Cubre los datos de las cuentas de agencia (TripAgent responsable) y, en #viajeros,
 * los datos de los pasajeros (la agencia es responsable y TripAgent, encargado). Es la referencia
 * de los avisos simplificados de /registro, el folleto y el Magic Link. Pendiente de revisión legal
 * y de la razón social del responsable (sección G de ../CLAUDE.md).
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
            Aviso de Privacidad Integral
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Última actualización: {LAST_UPDATED} · Conforme a la Ley Federal de Protección de Datos
            Personales en Posesión de los Particulares (LFPDPPP), publicada en el Diario Oficial de
            la Federación el 20 de marzo de 2025.
          </p>
        </div>

        <NoticeSection number="01" title="Identidad y domicilio del responsable">
          <p>
            <strong className="text-slate-900">{TRIPAGENT_LEGAL_NAME}</strong>, con domicilio en{" "}
            {TRIPAGENT_ADDRESS}, es responsable del tratamiento de los datos personales de las
            agencias y coordinadores que crean una cuenta en la plataforma. Contacto: {emailLink}.
          </p>
        </NoticeSection>

        <NoticeSection number="02" title="Datos personales que tratamos">
          <p>
            De las personas que registran una agencia: nombre completo, nombre comercial de la
            agencia, número de WhatsApp, correo electrónico y contraseña (guardada cifrada con un
            algoritmo de hash; nunca en texto plano). Con el uso de la plataforma, también los datos
            de la agencia que la propia agencia captura (perfil público, datos bancarios para
            recibir pagos de sus viajeros, políticas y logotipo).
          </p>
          <p>
            <strong className="text-slate-900">No tratamos datos personales sensibles.</strong>{" "}
            TripAgent no solicita información sobre el estado de salud, alergias o padecimientos de
            ninguna persona.
          </p>
        </NoticeSection>

        <NoticeSection number="03" title="Finalidades del tratamiento">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Crear y administrar la cuenta de tu agencia y permitirte iniciar sesión.</li>
            <li>Brindarte soporte técnico y atención por WhatsApp o correo electrónico.</li>
            <li>Gestionar tu prueba gratuita y tu suscripción.</li>
            <li>Cumplir obligaciones legales aplicables.</li>
          </ul>
          <p>
            Todas son finalidades necesarias para prestar el servicio. No usamos tus datos para
            publicidad de terceros ni los vendemos, rentamos o cedemos.
          </p>
        </NoticeSection>

        <NoticeSection number="04" title="Cómo limitar el uso o divulgación de tus datos">
          <p>
            Puedes pedirnos en cualquier momento que limitemos el uso de tus datos o que dejemos de
            enviarte comunicaciones escribiendo a {emailLink}.
          </p>
        </NoticeSection>

        <NoticeSection number="05" title="Derechos ARCO y plazos">
          <p>
            Tienes derecho a acceder a tus datos, rectificarlos, cancelarlos u oponerte a su
            tratamiento (derechos ARCO). Envía tu solicitud a {emailLink} con tu nombre, un medio
            para comunicarte contigo, un documento que acredite tu identidad (o la de tu
            representante) y la descripción clara de lo que solicitas. El ejercicio de estos
            derechos es gratuito.
          </p>
          <p>
            Te comunicaremos nuestra respuesta en un plazo máximo de{" "}
            <strong className="text-slate-900">20 días hábiles</strong> contados desde que recibamos
            tu solicitud y, si resulta procedente, la haremos efectiva dentro de los{" "}
            <strong className="text-slate-900">15 días hábiles</strong> siguientes a la respuesta
            (artículo 31 de la LFPDPPP). Estos plazos solo pueden ampliarse una vez por un periodo
            igual cuando las circunstancias del caso lo justifiquen.
          </p>
          <p>
            Si consideras que tu solicitud no fue atendida conforme a la ley, puedes acudir a la
            autoridad competente en materia de protección de datos personales en posesión de los
            particulares: la{" "}
            <strong className="text-slate-900">Secretaría Anticorrupción y Buen Gobierno</strong>.
          </p>
        </NoticeSection>

        <NoticeSection id="viajeros" number="06" title="Si eres viajero de una agencia">
          <p>
            Cuando una agencia de viajes usa TripAgent para organizar un tour, la{" "}
            <strong className="text-slate-900">agencia es la responsable</strong> de los datos de
            sus pasajeros y {TRIPAGENT_LEGAL_NAME} actúa únicamente como{" "}
            <strong className="text-slate-900">encargado tecnológico</strong>: tratamos esos datos
            solo por instrucciones de la agencia y para la gestión logística del viaje.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Datos que puede pedirte la agencia: nombre completo, WhatsApp, correo, fecha de
              nacimiento, contacto de emergencia, punto de abordaje y asiento. No se piden datos de
              salud.
            </li>
            <li>
              Finalidades: apartar tu lugar, registrar a tu grupo, asignar asientos, generar el
              manifiesto de abordaje y tu estado de cuenta.
            </li>
            <li>
              No usamos tus datos para fines propios ni comerciales, guardamos confidencialidad y
              aplicamos medidas de seguridad. Cuando la agencia deja de usar el servicio, sus datos
              se devuelven o se suprimen a su solicitud.
            </li>
            <li>
              Quien registra a un grupo declara ser mayor de edad y contar con la autorización de
              sus acompañantes o ejercer la patria potestad o tutela de los menores que registra.
            </li>
            <li>
              Para limitar el uso de tus datos o ejercer tus derechos ARCO, contacta a la agencia
              que organiza tu viaje. Si nos escribes a {emailLink}, canalizaremos tu solicitud a la
              agencia.
            </li>
          </ul>
        </NoticeSection>

        <NoticeSection number="07" title="Seguridad y vulneraciones">
          <p>
            Usamos conexiones cifradas (HTTPS/TLS), contraseñas protegidas con hash y aislamiento de
            la información de cada agencia. Si ocurriera una vulneración de seguridad que afecte de
            forma significativa tus derechos, te lo informaremos de inmediato (artículo 19 de la
            LFPDPPP).
          </p>
        </NoticeSection>

        <NoticeSection number="08" title="Cambios a este aviso">
          <p>
            Publicaremos cualquier cambio en esta página, con la fecha de su última actualización, y
            lo comunicaremos a las agencias con cuenta activa por correo electrónico o WhatsApp.
            Consulta también nuestros{" "}
            <Link href="/terminos" className="font-semibold text-[#3525cd] hover:underline">
              Términos y Condiciones de Servicio
            </Link>
            .
          </p>
        </NoticeSection>

        <LegalSupportCard />
      </main>
      <LegalFooter />
    </>
  );
}

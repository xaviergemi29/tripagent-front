import type { Metadata } from "next";
import { LegalHeader } from "@/features/legal/components/LegalHeader";
import { LegalFooter } from "@/features/legal/components/LegalFooter";
import { TerminosClientView } from "@/features/legal/components/TerminosClientView";

export const metadata: Metadata = {
  // `absolute`: el título no lleva la plantilla "%s · TripAgent".
  title: { absolute: "Términos y Condiciones de Servicio | TripAgent MX" },
  description:
    "Reglas claras, transparentes y sin letras chiquitas para agencias de viajes y coordinadores de tours en México. TripAgent MX.",
};

export default function TerminosPage() {
  return (
    <>
      <LegalHeader active="terminos" />
      <TerminosClientView />
      <LegalFooter />
    </>
  );
}

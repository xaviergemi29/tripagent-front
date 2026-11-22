import { Check } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/support-config";
import { TERMINOS_SOPORTE } from "../../constants/terminos-content.constants";
import { LegalSection } from "./LegalSection";

/** Punto 05 — Cancelación, disponibilidad y soporte. */
export function SeccionCancelacionSoporte() {
  return (
    <LegalSection id="soporte" number="05" title={TERMINOS_SOPORTE.title}>
      <ul className="space-y-2.5">
        {TERMINOS_SOPORTE.items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-100 p-0.5 text-emerald-700"
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
      <p>
        {TERMINOS_SOPORTE.legalChannelLabel}{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-semibold text-[#3525cd] hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
    </LegalSection>
  );
}

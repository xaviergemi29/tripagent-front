"use client";

import { useEffect, useState } from "react";
import {
  TERMINOS_LAST_UPDATED,
  TERMINOS_SECTIONS,
  type TerminosSectionId,
} from "../constants/terminos-content.constants";
import { LegalStickyNav } from "./LegalStickyNav";
import { LegalMobileNav } from "./LegalMobileNav";
import { LegalSupportCard } from "./LegalSupportCard";
import { ResumenEjecutivoCard } from "./terminos-sections/ResumenEjecutivoCard";
import { SeccionNaturaleza } from "./terminos-sections/SeccionNaturaleza";
import { SeccionPruebaSuscripcion } from "./terminos-sections/SeccionPruebaSuscripcion";
import { SeccionPropiedadDatos } from "./terminos-sections/SeccionPropiedadDatos";
import { SeccionResponsabilidad } from "./terminos-sections/SeccionResponsabilidad";
import { SeccionCancelacionSoporte } from "./terminos-sections/SeccionCancelacionSoporte";
import { LegalCtaBanner } from "./terminos-sections/LegalCtaBanner";

const FIRST_SECTION: TerminosSectionId = TERMINOS_SECTIONS[0].id;

/**
 * Cuerpo interactivo de /terminos: índice fijo (escritorio) o píldoras (celular) con scroll suave y
 * "scroll spy" (la sección visible queda marcada en el índice).
 */
export function TerminosClientView() {
  const [activeId, setActiveId] = useState<TerminosSectionId>(FIRST_SECTION);

  useEffect(() => {
    const elements = TERMINOS_SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (element): element is HTMLElement => element !== null,
    );
    if (elements.length === 0 || typeof IntersectionObserver === "undefined") return;

    // La sección activa es la que cruza la franja superior de la pantalla (bajo el encabezado).
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id as TerminosSectionId);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const handleNavigate = (id: TerminosSectionId) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
          🇲🇽 Marco Legal · México
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
          Términos y Condiciones de Servicio
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>
            Última actualización: {TERMINOS_LAST_UPDATED} · Reglas claras y transparentes para
            agencias y coordinadores de viaje.
          </span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            • Vigente
          </span>
        </p>
      </div>

      <LegalMobileNav activeId={activeId} onNavigate={handleNavigate} />

      <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
        <div>
          <LegalStickyNav activeId={activeId} onNavigate={handleNavigate} />
        </div>

        <div className="min-w-0 space-y-6">
          <ResumenEjecutivoCard />
          <SeccionNaturaleza />
          <SeccionPruebaSuscripcion />
          <SeccionPropiedadDatos />
          <SeccionResponsabilidad />
          <SeccionCancelacionSoporte />
          {/* En celular la tarjeta de dudas legales va al final (el índice lateral no se muestra). */}
          <div className="md:hidden">
            <LegalSupportCard />
          </div>
          <LegalCtaBanner />
        </div>
      </div>
    </main>
  );
}

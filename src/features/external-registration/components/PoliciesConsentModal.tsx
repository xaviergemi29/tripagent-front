"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export interface PoliciesConsentModalProps {
  isOpen: boolean;
  /** Cierra sin cambiar la casilla (✕, Esc o clic fuera del modal). */
  onClose: () => void;
  /** "Aceptar y continuar": la vista marca la casilla y cierra el modal. */
  onAccept: () => void;
  /** Políticas generales de la agencia (texto plano de Configuración → Políticas). */
  policiesText?: string | null;
  /** Enlace al aviso de privacidad completo de la agencia (Configuración → Agencia). */
  privacyNoticeUrl?: string | null;
  agencyName: string;
}

/**
 * Modal "Políticas de Viaje y Aviso de Privacidad" del registro del Magic Link. Muestra el texto
 * plano de la agencia respetando sus saltos de línea (sin HTML ni markdown).
 */
export function PoliciesConsentModal({
  isOpen,
  onClose,
  onAccept,
  policiesText,
  privacyNoticeUrl,
  agencyName,
}: PoliciesConsentModalProps) {
  const policies = policiesText?.trim();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-2xl bg-white p-0 sm:max-w-lg sm:rounded-3xl"
      >
        {/* Encabezado: título y cerrar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <DialogTitle className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            Políticas de Viaje y Aviso de Privacidad
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo con scroll interno */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 text-sm leading-relaxed text-slate-700 sm:px-6">
          {policies ? (
            <DialogDescription asChild>
              <p className="whitespace-pre-line text-slate-700">{policies}</p>
            </DialogDescription>
          ) : (
            // Sin políticas capturadas no se inventan condiciones: se remite a la agencia.
            <DialogDescription className="text-slate-600">
              {agencyName} aún no ha publicado sus políticas de viaje. Si tienes dudas sobre
              cancelaciones, anticipos o cambios, consúltalas directamente con la agencia.
            </DialogDescription>
          )}

          {privacyNoticeUrl && (
            <p className="text-slate-600">
              Consulta el{" "}
              <a
                href={privacyNoticeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-indigo-700 underline hover:text-indigo-800"
              >
                aviso de privacidad completo
              </a>{" "}
              de {agencyName}.
            </p>
          )}
        </div>

        {/* Pie: acción principal */}
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-5 py-4">
          <Button
            type="button"
            onClick={onAccept}
            className="h-10 w-full rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700 sm:w-auto"
          >
            Aceptar y continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

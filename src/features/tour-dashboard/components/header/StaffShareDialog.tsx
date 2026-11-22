"use client";

import { useState } from "react";
import { ExternalLink, Link2, Loader2, RefreshCw, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { copyToClipboard } from "@/shared/utils/clipboard";
import { buildStaffShareUrl, buildWhatsAppUrl } from "@/shared/utils/share-links.util";
import { formatMexicoDateTime } from "@/shared/utils/tour-date.util";
import type { StaffShareLinkOutput } from "../../schemas/tour-dashboard.schema";
import { useGenerateStaffShare, useRevokeStaffShare } from "../../hooks/useStaffShare";

interface StaffShareDialogProps {
  tourId: string;
  tourTitle: string;
  /** Enlace vigente del dashboard (`staffShare`); `null` si no hay. */
  staffShare: StaffShareLinkOutput | null;
  /**
   * Falso con la cuenta en Modo Solo Lectura: se puede copiar un enlace que ya existe, pero no
   * generar, regenerar ni desactivar (la API respondería 402).
   */
  canManage: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PendingConfirm = "regenerate" | "revoke" | null;

/**
 * Compartir con staff: el coordinador ve asiento, nombre, Adulto/Niño, punto y hora y estatus en
 * `/s/[token]`, sin cuenta y sin montos ni teléfonos.
 */
export function StaffShareDialog({
  tourId,
  tourTitle,
  staffShare,
  canManage,
  open,
  onOpenChange,
}: StaffShareDialogProps) {
  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const { mutate: generate, isPending: isGenerating } = useGenerateStaffShare(tourId);
  const { mutate: revoke, isPending: isRevoking } = useRevokeStaffShare(tourId);
  const isBusy = isGenerating || isRevoking;

  const url = staffShare ? buildStaffShareUrl(staffShare.token) : null;
  const expiresAt = staffShare ? formatMexicoDateTime(staffShare.expiresAt) : "";

  const handleCopy = async (link: string) => {
    const copied = await copyToClipboard(link);
    if (copied) toast.success("Enlace copiado");
    else toast.error("No se pudo copiar el enlace");
  };

  const whatsappUrl = url
    ? // Sin teléfono: wa.me abre el selector de contacto de WhatsApp.
      buildWhatsAppUrl(null, {
        message: `Croquis y lista de pasajeros de *${tourTitle}* (solo lectura): ${url}`,
      })
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compartir con staff</DialogTitle>
            <DialogDescription>
              El coordinador ve el croquis y la lista: asiento, nombre, Adulto/Niño, punto y hora de
              abordaje y estatus. Sin montos ni teléfonos, y sin necesidad de cuenta.
            </DialogDescription>
          </DialogHeader>

          {!staffShare || !url ? (
            <Button
              className="h-11 w-full bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={isBusy}
              onClick={() => generate()}
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Generar enlace
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Input
                  readOnly
                  aria-label="Enlace para staff"
                  value={url}
                  onFocus={(event) => event.currentTarget.select()}
                  className="text-base sm:text-sm"
                />
                <p
                  className={
                    staffShare.isExpired
                      ? "text-xs font-semibold text-red-600"
                      : "text-xs text-slate-500"
                  }
                >
                  {staffShare.isExpired
                    ? "Vencido: este enlace ya no muestra el croquis."
                    : `Vigente hasta ${expiresAt} (hora CDMX)`}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button type="button" variant="outline" onClick={() => void handleCopy(url)}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar
                </Button>
                {whatsappUrl && (
                  <Button asChild variant="outline" className="text-emerald-700">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="mr-2 h-4 w-4" /> Enviar por WhatsApp
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Abrir
                  </a>
                </Button>
              </div>

              {canManage && (
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={isBusy}
                    onClick={() => setConfirm("regenerate")}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Regenerar enlace
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={isBusy}
                    onClick={() => setConfirm("revoke")}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Desactivar enlace
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={confirm === "regenerate"}
        onOpenChange={(next) => !next && setConfirm(null)}
        title="¿Regenerar el enlace?"
        description="El enlace anterior dejará de funcionar. Úsalo si cambió el coordinador."
        confirmText="Regenerar"
        onConfirm={() => generate()}
      />
      <ConfirmDialog
        isOpen={confirm === "revoke"}
        onOpenChange={(next) => !next && setConfirm(null)}
        title="¿Desactivar el enlace?"
        description="El enlace dejará de mostrar el croquis y la lista. Podrás generar uno nuevo cuando quieras."
        confirmText="Desactivar"
        isDestructive
        onConfirm={() => revoke()}
      />
    </>
  );
}

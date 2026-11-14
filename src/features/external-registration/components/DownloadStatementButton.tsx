"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generatePartialPaymentReceiptPDF } from "../pdf/payment-receipt.pdf";
import {
  buildMagicLinkStatement,
  type MagicLinkStatementSource,
} from "../pdf/magic-link-statement";

interface DownloadStatementButtonProps {
  /**
   * Datos del Magic Link que la vista ya tiene (no se consulta la API). Son datos planos y no una
   * función, porque `PaidBookingView` es un Server Component y solo puede pasar props serializables
   * a este componente cliente. La conversión al PDF ocurre aquí, al hacer clic.
   */
  source: MagicLinkStatementSource;
  className?: string;
}

/** "Descargar Estado de Cuenta en PDF": estado de cuenta del viajero (Magic Link: parcial o liquidado). */
export function DownloadStatementButton({ source, className }: DownloadStatementButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (): Promise<void> => {
    try {
      setIsGenerating(true);
      await generatePartialPaymentReceiptPDF(buildMagicLinkStatement(source));
      toast.success("Comprobante en PDF generado correctamente");
    } catch (error) {
      console.error("Error al generar comprobante PDF:", error);
      toast.error("No se pudo generar el comprobante. Por favor intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleDownload}
      disabled={isGenerating}
      className={cn(
        "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-indigo-200 bg-indigo-50/50 px-4 py-2.5 text-xs font-semibold text-indigo-700 shadow-none transition-all hover:bg-indigo-100/70",
        className,
      )}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
          <span>Generando comprobante...</span>
        </>
      ) : (
        <>
          <FileText className="h-3.5 w-3.5 text-indigo-600" />
          <span>Descargar Estado de Cuenta en PDF</span>
        </>
      )}
    </Button>
  );
}

import { X, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  travelerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentValidationModal({ travelerId, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Detenemos la propagación para que los clics dentro del modal no lo cierren */}
      <div
        className="animate-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-bold text-slate-900">Validar Comprobante</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-100">
            {/* Aquí iría la etiqueta <img> real con la URL del comprobante */}
            <span className="font-medium text-slate-400">
              [Imagen del Ticket enviado por WhatsApp]
            </span>
          </div>

          <div className="flex gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              El sistema detectó un pago de <strong>$500 MXN</strong>. Revisa la imagen para
              confirmar que la transferencia fue exitosa.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t bg-slate-50 p-4">
          <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700">
            Rechazar (Pedir otra foto)
          </Button>
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Check className="mr-2 h-4 w-4" /> Aprobar Pago
          </Button>
        </div>
      </div>
    </div>
  );
}

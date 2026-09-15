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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      {/* Detenemos la propagación para que los clics dentro del modal no lo cierren */}
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg text-slate-900">Validar Comprobante</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="aspect-square bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
            {/* Aquí iría la etiqueta <img> real con la URL del comprobante */}
            <span className="text-slate-400 font-medium">[Imagen del Ticket enviado por WhatsApp]</span>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg text-sm flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>El sistema detectó un pago de <strong>$500 MXN</strong>. Revisa la imagen para confirmar que la transferencia fue exitosa.</p>
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">Rechazar (Pedir otra foto)</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white"><Check className="w-4 h-4 mr-2"/> Aprobar Pago</Button>
        </div>
      </div>
    </div>
  );
}
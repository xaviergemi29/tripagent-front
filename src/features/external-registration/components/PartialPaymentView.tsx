"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  CreditCard,
  Hourglass,
  MessageCircle,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Building2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PartialPaymentViewProps {
  bookingId: string;
  tourInfo: {
    title: string;
    departureDateTime: string;
  };
  financials: {
    totalAmount: number;
    amountPaid: number;
    remainingBalance: number;
    status: string;
  };
  paymentHistory: {
    id: string;
    date: string;
    amount: number;
    method: string;
    reference?: string;
  }[];
  passengers: {
    name: string;
    type: string;
  }[];
  agency: {
    name: string;
    phone: string;
    bankName: string | null;
    accountHolder: string | null;
    clabeNumber: string | null;
  };
  token?: string;
}

export function PartialPaymentView({
  tourInfo,
  financials,
  paymentHistory = [],
  passengers = [],
  agency,
}: PartialPaymentViewProps) {
  const [copied, setCopied] = useState(false);

  // Cálculos defensivos
  const totalCost = financials.totalAmount || 0;
  const totalPaid = financials.amountPaid || 0;
  const remaining = Math.max(0, financials.remainingBalance || 0);
  const percentagePaid =
    totalCost > 0 ? Math.min(100, Math.round((totalPaid / totalCost) * 100)) : 0;
  const isFullyPaid = remaining === 0;

  const handleCopyClabe = async () => {
    if (!agency.clabeNumber) return;
    try {
      await navigator.clipboard.writeText(agency.clabeNumber.replace(/\s+/g, ""));
      setCopied(true);
      toast.success("CLABE copiada al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Error al copiar la CLABE");
    }
  };

  const handleSendWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Hola ${agency.name}! Quiero reportar un nuevo abono para mi reservación en el "${tourInfo.title}". Adjunto mi comprobante:`,
    );
    window.open(`https://wa.me/${agency.phone.replace(/\D/g, "")}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] font-sans text-slate-800 antialiased">
      {/* Header Web Ligero (Sin navegación nativa) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-indigo-50 bg-white/95 px-4 py-3 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
          <span className="text-xs font-bold tracking-wider text-indigo-900 uppercase">
            {agency.name}
          </span>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
        >
          • Viaje confirmado
        </Badge>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pt-5">
        {/* Título y Resumen del Tour */}
        <div className="space-y-1">
          <Badge className="border-indigo-100 bg-indigo-50 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50">
            TU RESERVACIÓN
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{tourInfo.title}</h1>
          <p className="flex items-center gap-1.5 pt-0.5 text-xs text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            Aquí puedes ver tus pagos y la información de tu salida.
          </p>
        </div>

        {/* Card Principal: Resumen de Pagos y Barra de Avance */}
        <Card className="overflow-hidden rounded-2xl border-indigo-100/70 bg-white shadow-sm">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-indigo-900 uppercase">
              <ReceiptText className="h-4 w-4 text-indigo-600" /> Tus Pagos
            </div>

            {/* Fila: Costo Total */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase">
                  Costo total del viaje
                </p>
                <p className="text-lg font-bold text-slate-900">
                  ${totalCost.toLocaleString("es-MX")}{" "}
                  <span className="text-xs font-normal text-slate-500">MXN</span>
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>

            {/* Fila: Lo que llevas pagado */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-100/60 bg-emerald-50/60 p-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase">
                    Lo que llevas pagado
                  </p>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] leading-none font-medium text-emerald-700">
                    Abonado
                  </span>
                </div>
                <p className="mt-0.5 text-lg font-bold text-emerald-700">
                  +${totalPaid.toLocaleString("es-MX")}{" "}
                  <span className="text-xs font-normal text-emerald-600">MXN</span>
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>
            </div>

            {/* Fila: Te falta por pagar (O Liquidado) */}
            <div
              className={`flex items-center justify-between rounded-xl border p-3 ${
                isFullyPaid
                  ? "border-emerald-100 bg-emerald-50/50"
                  : "border-indigo-100/60 bg-indigo-50/50"
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <p
                    className={`text-[11px] font-semibold uppercase ${
                      isFullyPaid ? "text-emerald-800" : "text-indigo-900"
                    }`}
                  >
                    {isFullyPaid ? "Estado de cuenta" : "Te falta por pagar"}
                  </p>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] leading-none font-medium ${
                      isFullyPaid
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {isFullyPaid ? "Liquidado" : "Pendiente"}
                  </span>
                </div>
                <p
                  className={`mt-0.5 text-lg font-bold ${
                    isFullyPaid ? "text-emerald-700" : "text-indigo-950"
                  }`}
                >
                  ${remaining.toLocaleString("es-MX")}{" "}
                  <span
                    className={`text-xs font-normal ${
                      isFullyPaid ? "text-emerald-600" : "text-indigo-600"
                    }`}
                  >
                    MXN
                  </span>
                </p>
              </div>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  isFullyPaid ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
                }`}
              >
                {isFullyPaid ? <Check className="h-5 w-5" /> : <Hourglass className="h-5 w-5" />}
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  {percentagePaid === 50
                    ? "Llevas la mitad pagada (50%)"
                    : isFullyPaid
                      ? "¡Felicidades, tu viaje está liquidado!"
                      : `Llevas ${percentagePaid}% liquidado`}
                </span>
                <span className="font-medium text-slate-500">{percentagePaid}% liquidado</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${percentagePaid}%` }}
                />
              </div>
            </div>

            {/* Lista de Abonos Registrados */}
            {paymentHistory.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> TUS ABONOS REGISTRADOS
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {paymentHistory.length} {paymentHistory.length === 1 ? "pago" : "pagos"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {paymentHistory.map((p, index) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-50 text-indigo-600">
                          <ReceiptText className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            Abono {index + 1} • {p.method}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(p.date).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600">
                        +${Number(p.amount).toLocaleString("es-MX")} MXN
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personas en este viaje */}
        <Card className="rounded-2xl border-indigo-100/70 bg-white shadow-sm">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase">
                <Users className="h-4 w-4 text-indigo-600" /> Personas en este viaje (
                {passengers.length})
              </div>
            </div>
            <div className="space-y-2 pt-1">
              {passengers.map((pass, idx) => (
                <div
                  key={idx}
                  className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{pass.name}</p>
                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                      {pass.type}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 pt-0.5 text-xs text-slate-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                    <span>
                      Salida programada:{" "}
                      <strong className="font-medium text-slate-800">
                        {tourInfo.departureDateTime}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dónde hacer tus próximos pagos */}
        {!isFullyPaid && agency.bankName && agency.clabeNumber && (
          <Card className="rounded-2xl border-indigo-100/70 bg-white shadow-sm">
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 uppercase">
                <Building2 className="h-4 w-4 text-indigo-600" /> Dónde hacer tus próximos pagos
              </div>
              <p className="text-xs text-slate-600">
                Puedes ir liquidando poco a poco antes del día de salida en la siguiente cuenta:
              </p>
              <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/60 py-1">
                  <span className="text-slate-500">Banco</span>
                  <span className="font-bold text-slate-800">{agency.bankName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/60 py-1">
                  <span className="text-slate-500">A nombre de</span>
                  <span className="text-right font-semibold text-slate-800">
                    {agency.accountHolder}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-500">CLABE interbancaria</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyClabe}
                      className="h-7 gap-1 border-indigo-200 bg-indigo-50/50 px-2.5 text-[11px] text-indigo-700 hover:bg-indigo-100"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>¡Copiada!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-center font-mono text-sm font-semibold tracking-wider text-slate-800">
                    {agency.clabeNumber}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA a WhatsApp para Enviar Comprobante */}
        {!isFullyPaid && (
          <div className="space-y-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">¿Hiciste otro abono o pago?</h3>
                <p className="text-xs leading-tight text-emerald-800/90">
                  Mándanos una foto de tu comprobante por WhatsApp para anotarlo a tu cuenta.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleSendWhatsApp}
              className="h-11 w-full gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:bg-emerald-700 active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4 fill-current" /> Enviar comprobante por WhatsApp
            </Button>
          </div>
        )}

        {/* Pie Informativo */}
        <p className="pt-2 pb-6 text-center text-[11px] text-slate-400">
          🔒 Este enlace es tu comprobante digital personal • {agency.name}
        </p>
      </main>
    </div>
  );
}

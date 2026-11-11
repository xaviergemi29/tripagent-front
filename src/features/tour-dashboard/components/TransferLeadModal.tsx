"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeftRight, Users, UserPlus, CheckCircle2, UserX, CreditCard } from "lucide-react";

export interface CompanionPassenger {
  id: string;
  fullName: string;
  relationship?: string;
  phone?: string;
  seatNumber?: string | null;
}

export interface CurrentBookingData {
  tourTitle: string;
  currentLead: {
    id: string;
    fullName: string;
    seatNumber?: string | null;
  };
  companions: CompanionPassenger[];
  finances: {
    totalPrice: number;
    amountPaid: number;
    pendingBalance: number;
    currency: "MXN" | "USD";
  };
}

export interface TransferPayload {
  targetType: "COMPANION" | "EXTERNAL";
  selectedCompanionId?: string;
  externalData?: {
    fullName: string;
    phone: string;
    email?: string;
  };
}

interface TransferLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: CurrentBookingData;
  onConfirmTransfer: (payload: TransferPayload) => Promise<void> | void;
  isLoading?: boolean;
}

export function TransferLeadModal({
  open,
  onOpenChange,
  booking,
  onConfirmTransfer,
  isLoading = false,
}: TransferLeadModalProps) {
  const [targetType, setTargetType] = useState<"COMPANION" | "EXTERNAL">(
    booking.companions.length > 0 ? "COMPANION" : "EXTERNAL",
  );
  const [selectedCompanionId, setSelectedCompanionId] = useState<string>(
    booking.companions[0]?.id || "",
  );

  const [externalName, setExternalName] = useState("");
  const [externalPhone, setExternalPhone] = useState("");
  const [externalEmail, setExternalEmail] = useState("");

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString("es-MX", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} ${booking.finances.currency}`;
  };

  const handleConfirm = () => {
    if (targetType === "COMPANION") {
      if (!selectedCompanionId) return;
      onConfirmTransfer({
        targetType: "COMPANION",
        selectedCompanionId,
      });
    } else {
      if (!externalName.trim() || !externalPhone.trim()) return;
      onConfirmTransfer({
        targetType: "EXTERNAL",
        externalData: {
          fullName: externalName.trim(),
          phone: externalPhone.trim(),
          email: externalEmail.trim() || undefined,
        },
      });
    }
  };

  const isFormValid =
    targetType === "COMPANION"
      ? Boolean(selectedCompanionId)
      : externalName.trim().length > 2 && externalPhone.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl sm:max-w-[620px]">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500" />

        <div className="space-y-6 p-6">
          <div className="flex items-start gap-3.5">
            <div className="flex shrink-0 items-center justify-center rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-indigo-700 uppercase">
                  Transferir Titular
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium tracking-wider text-slate-600 uppercase">
                  {booking.tourTitle}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Transferir Titularidad de Reserva
              </DialogTitle>
              <p className="text-sm text-slate-500">
                Asigna la reserva de{" "}
                <span className="font-semibold text-slate-800">{booking.currentLead.fullName}</span>{" "}
                a otra persona.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Selecciona el tipo de nuevo titular *
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={booking.companions.length === 0}
                onClick={() => setTargetType("COMPANION")}
                className={`relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                  targetType === "COMPANION"
                    ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                } ${
                  booking.companions.length === 0
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
              >
                <div className="mb-1 flex w-full items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span>Acompañante registrado</span>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                    {booking.companions.length} en viaje
                  </span>
                </div>
                <div className="mt-2 flex w-full items-center justify-between">
                  <p className="text-xs text-slate-500">
                    {booking.companions.length > 0
                      ? "Viajero que ya está en este viaje."
                      : "Sin acompañantes registrados."}
                  </p>
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      targetType === "COMPANION"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {targetType === "COMPANION" && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("EXTERNAL")}
                className={`relative flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                  targetType === "EXTERNAL"
                    ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="mb-1 flex w-full items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <UserPlus className="h-4 w-4 text-indigo-600" />
                    <span>Persona externa o nueva</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    Nuevo viajero
                  </span>
                </div>
                <div className="mt-2 flex w-full items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Buscar en directorio o registrar uno nuevo.
                  </p>
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      targetType === "EXTERNAL"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {targetType === "EXTERNAL" && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {targetType === "COMPANION" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-600">
                  Seleccionar Acompañante *
                </Label>
                <span className="text-xs text-slate-400">
                  {booking.companions.length} acompañante(s) en el viaje
                </span>
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {booking.companions.map((companion) => {
                  const isSelected = selectedCompanionId === companion.id;
                  const initials = companion.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();
                  return (
                    <div
                      key={companion.id}
                      onClick={() => setSelectedCompanionId(companion.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {companion.fullName}
                            </span>
                            {companion.relationship && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                                {companion.relationship}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                            {companion.phone && <span>{companion.phone}</span>}
                            {companion.phone && <span>•</span>}
                            <span>Asiento: {companion.seatNumber || "Sin asignar"}</span>
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100/80 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Seleccionado</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 hover:text-slate-600">
                          Seleccionar
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {targetType === "EXTERNAL" && (
            <div className="space-y-3.5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Nombre Completo del Nuevo Titular *
                </Label>
                <Input
                  placeholder="Ej. Carlos Mendoza"
                  value={externalName}
                  onChange={(e) => setExternalName(e.target.value)}
                  className="border-slate-200 bg-white focus-visible:ring-indigo-600"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    WhatsApp * (10 dígitos)
                  </Label>
                  <Input
                    placeholder="2281458920"
                    maxLength={10}
                    value={externalPhone}
                    onChange={(e) =>
                      setExternalPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    className="border-slate-200 bg-white focus-visible:ring-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Correo Electrónico (Opcional)
                  </Label>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={externalEmail}
                    onChange={(e) => setExternalEmail(e.target.value)}
                    className="border-slate-200 bg-white focus-visible:ring-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-red-200/70 bg-red-50/60 p-3.5">
            <div className="flex items-center gap-3">
              <div className="shrink-0 rounded-lg bg-red-100 p-2 text-red-600">
                <UserX className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Baja y transferencia de titular</p>
                <p className="text-xs text-slate-600">
                  {booking.currentLead.fullName} se dará de baja y su lugar se transferirá a la
                  nueva persona titular.
                </p>
              </div>
            </div>
            <span className="ml-2 shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              Baja de titular
            </span>
          </div>

          <div className="space-y-2.5 rounded-xl border border-slate-200/80 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              <span>Resumen de pagos y lugares</span>
            </div>
            <div className="grid grid-cols-1 gap-4 pt-1 text-xs sm:grid-cols-2">
              <div>
                <span className="mb-0.5 block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  PAGOS
                </span>
                <p className="text-slate-800">
                  Pagado:{" "}
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(booking.finances.amountPaid)}
                  </span>{" "}
                  • Por pagar:{" "}
                  <span className="font-bold text-red-600">
                    {formatCurrency(booking.finances.pendingBalance)}
                  </span>
                </p>
                <span className="text-[11px] text-slate-400">(asumido por el nuevo titular)</span>
              </div>
              <div>
                <span className="mb-0.5 block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  LUGARES
                </span>
                <p className="text-slate-700">
                  {targetType === "COMPANION" ? (
                    <>
                      1 lugar en el viaje (
                      {booking.companions.find((c) => c.id === selectedCompanionId)?.fullName ||
                        "Acompañante"}
                      ) • 1 cupo liberado en el tour.
                    </>
                  ) : (
                    <>
                      {booking.companions.length + 1} lugares en el viaje (1 nuevo titular +{" "}
                      {booking.companions.length} acompañante
                      {booking.companions.length !== 1 ? "s" : ""}).
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="text-slate-600 hover:text-slate-900"
            >
              Cancelar y Volver
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!isFormValid || isLoading}
              className="rounded-xl bg-indigo-600 px-5 font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
            >
              {isLoading ? (
                "Guardando..."
              ) : (
                <>
                  Confirmar Transferencia de Titularidad
                  <ArrowLeftRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

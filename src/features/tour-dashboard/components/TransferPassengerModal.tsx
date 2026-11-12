"use client";

import { useState } from "react";
import { PASSENGER_ROLE, type PassengerRole } from "@/shared/constants/domain.constants";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowLeftRight, Check, ChevronDown, Copy, Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { toast } from "sonner";
import { copyToClipboard } from "@/shared/utils/clipboard";
import { buildMagicLinkUrl, buildWhatsAppUrl } from "@/shared/utils/share-links.util";

import { useTransferPassenger } from "../hooks/useTourDashboard";
import {
  transferPassengerSchema,
  type TransferPassengerFormInput,
} from "../schemas/transfer-passenger.schema";

interface TransferPassengerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  passengerId: string;
  role: PassengerRole;
  currentName: string;
  currentWhatsapp: string | null;
}

const EMPTY_TO_UNDEFINED = (value: string): string | undefined => value.trim() || undefined;

/**
 * Transfiere un lugar (titular o acompañante) a otra persona.
 * La API conserva asiento, precio y abonos. Si es el titular y cambia el WhatsApp, el saldo pasa
 * al nuevo titular y se regenera el Magic Link (el anterior deja de funcionar).
 */
export function TransferPassengerModal({
  open,
  onOpenChange,
  bookingId,
  passengerId,
  role,
  currentName,
  currentWhatsapp,
}: TransferPassengerModalProps) {
  const isTitular = role === PASSENGER_ROLE.TITULAR;
  const [isMedicalOpen, setIsMedicalOpen] = useState(false);
  const [newMagicLink, setNewMagicLink] = useState<{ url: string; whatsapp: string } | null>(null);
  const { mutate, isPending } = useTransferPassenger();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<TransferPassengerFormInput>({
    resolver: zodResolver(transferPassengerSchema),
    mode: "onChange",
    defaultValues: {
      role,
      isMinor: false,
      fullName: "",
      whatsapp: "",
      email: "",
      inheritTitularBoardingPoint: !isTitular,
      medicalNotes: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  const isMinor = useWatch({ control, name: "isMinor" });
  const whatsapp = useWatch({ control, name: "whatsapp" });
  const keepsSameWhatsapp = isTitular && !!currentWhatsapp && whatsapp === currentWhatsapp;

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) setNewMagicLink(null);
    onOpenChange(nextOpen);
  };

  const onSubmit = (values: TransferPassengerFormInput) => {
    mutate(
      {
        bookingId,
        data: {
          passengerId,
          role,
          fullName: values.fullName,
          whatsapp: EMPTY_TO_UNDEFINED(values.whatsapp),
          email: values.isMinor ? undefined : EMPTY_TO_UNDEFINED(values.email),
          isMinor: values.isMinor,
          inheritTitularBoardingPoint: !isTitular && values.inheritTitularBoardingPoint,
          medicalNotes: EMPTY_TO_UNDEFINED(values.medicalNotes),
          emergencyContactName: EMPTY_TO_UNDEFINED(values.emergencyContactName),
          emergencyContactPhone: EMPTY_TO_UNDEFINED(values.emergencyContactPhone),
        },
      },
      {
        onSuccess: (result) => {
          if (result.tokenRegenerated && result.magicToken) {
            setNewMagicLink({
              url: buildMagicLinkUrl(result.magicToken),
              whatsapp: values.whatsapp,
            });
            return;
          }
          handleClose(false);
        },
      },
    );
  };

  const handleCopyLink = async () => {
    if (!newMagicLink) return;
    const success = await copyToClipboard(newMagicLink.url);
    if (success) toast.success("Enlace copiado");
    else toast.error("Error al copiar");
  };

  const fieldError = (message?: string) =>
    message ? <p className="text-xs font-medium text-red-600">{message}</p> : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-slate-200 p-0 shadow-2xl sm:max-w-[560px]">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500" />

        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3.5">
            <div className="flex shrink-0 items-center justify-center rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-indigo-700 uppercase">
                {isTitular ? "Titular" : "Acompañante"}
              </span>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {isTitular ? "Transferir titularidad" : "Transferir lugar"}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                El lugar de <span className="font-semibold text-slate-800">{currentName}</span>{" "}
                pasará a otra persona. El asiento y el precio se conservan.
              </DialogDescription>
            </div>
          </div>

          {newMagicLink ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
                Titularidad transferida. Se generó un nuevo Magic Link y el anterior ya no funciona.
                Compártelo con el nuevo titular.
              </div>
              <div className="flex gap-2">
                <Input readOnly value={newMagicLink.url} className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
                  Cerrar
                </Button>
                <Button
                  type="button"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() =>
                    window.open(
                      buildWhatsAppUrl(newMagicLink.whatsapp, {
                        message: `¡Hola! Ahora eres titular de la reserva. Consulta tu estado de cuenta y boletos aquí: ${newMagicLink.url}`,
                      }),
                      "_blank",
                    )
                  }
                >
                  <WhatsAppIcon className="mr-2 h-4 w-4" />
                  Enviar por WhatsApp
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {isTitular && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p>El saldo abonado y el Magic Link pasarán a esta nueva persona.</p>
                </div>
              )}

              {/* Selector Adulto / Menor */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Tipo de pasajero *</Label>
                <Controller
                  control={control}
                  name="isMinor"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: false, label: "Adulto" },
                        { value: true, label: "Menor" },
                      ].map((option) => {
                        const isSelected = field.value === option.value;
                        const isDisabled = isTitular && option.value;
                        return (
                          <button
                            key={option.label}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              field.onChange(option.value);
                              if (option.value) setValue("email", "", { shouldValidate: true });
                            }}
                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-1 ring-indigo-600"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            } ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                {isTitular && (
                  <p className="text-[11px] text-slate-500">
                    El titular debe ser adulto: es el responsable financiero.
                  </p>
                )}
                {fieldError(errors.isMinor?.message)}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transfer-fullName" className="text-xs font-semibold text-slate-700">
                  Nombre completo *
                </Label>
                <Input
                  id="transfer-fullName"
                  placeholder="Ej. Carlos Mendoza"
                  {...register("fullName")}
                />
                {fieldError(errors.fullName?.message)}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="transfer-whatsapp"
                    className="text-xs font-semibold text-slate-700"
                  >
                    WhatsApp {isMinor ? "(opcional)" : "*"}
                  </Label>
                  <Input
                    id="transfer-whatsapp"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="2281458920"
                    {...register("whatsapp")}
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      void register("whatsapp").onChange(e);
                    }}
                  />
                  {fieldError(errors.whatsapp?.message)}
                  {keepsSameWhatsapp && (
                    <p className="text-[11px] text-slate-500">
                      Mismo WhatsApp: solo se corrigen los datos y el Magic Link se conserva.
                    </p>
                  )}
                </div>

                {!isMinor && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="transfer-email"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Correo electrónico *
                    </Label>
                    <Input
                      id="transfer-email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      {...register("email")}
                    />
                    {fieldError(errors.email?.message)}
                  </div>
                )}
              </div>

              {!isTitular && (
                <Controller
                  control={control}
                  name="inheritTitularBoardingPoint"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-700">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      Heredar punto de abordaje del titular
                    </label>
                  )}
                />
              )}

              {/* Acordeón opcional: datos médicos y de emergencia */}
              <div className="rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMedicalOpen((prev) => !prev)}
                  aria-expanded={isMedicalOpen}
                  className="flex w-full items-center justify-between px-3.5 py-3 text-sm font-semibold text-slate-700"
                >
                  Datos médicos y de emergencia (opcional)
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${isMedicalOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isMedicalOpen && (
                  <div className="space-y-3 border-t border-slate-100 p-3.5">
                    <p className="text-[11px] text-slate-500">
                      Las notas médicas de {currentName} no se transfieren.
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">
                          Contacto de emergencia
                        </Label>
                        <Input {...register("emergencyContactName")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">
                          Teléfono de emergencia
                        </Label>
                        <Input
                          inputMode="numeric"
                          maxLength={10}
                          {...register("emergencyContactPhone")}
                          onChange={(e) => {
                            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                            void register("emergencyContactPhone").onChange(e);
                          }}
                        />
                        {fieldError(errors.emergencyContactPhone?.message)}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Notas médicas</Label>
                      <Textarea rows={2} {...register("medicalNotes")} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleClose(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || isPending}
                  className="rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700"
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Confirmar transferencia
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

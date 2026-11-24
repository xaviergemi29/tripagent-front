"use client";

import { Controller, useForm, useFormState, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  SUBSCRIPTION_CANCELLATION_COMMENT_MAX,
  SUBSCRIPTION_CANCELLATION_REASON_DICT,
  SUBSCRIPTION_CANCELLATION_REASONS,
} from "@/shared/constants/domain.constants";
import { useCancelSubscription } from "../../hooks/useAgencySubscription";
import {
  cancelSubscriptionInputSchema,
  type CancelSubscriptionInput,
} from "../../schemas/subscription.schema";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fecha de corte ya formateada ("30 de noviembre de 2026"). */
  periodEndsOn: string;
}

/**
 * Baja programada de la suscripción (cobro por transferencia, 2026-11-23): motivo rápido, aviso de
 * hasta cuándo conserva el acceso completo y confirmación. No se cierra mientras se guarda.
 */
export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  periodEndsOn,
}: CancelSubscriptionDialogProps) {
  const { mutate, isPending } = useCancelSubscription();

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        {/* El formulario vive dentro de DialogContent: Radix lo desmonta al cerrar y abre limpio. */}
        <CancelSubscriptionForm
          periodEndsOn={periodEndsOn}
          isPending={isPending}
          onBack={() => onOpenChange(false)}
          onConfirm={(input) => mutate(input, { onSuccess: () => onOpenChange(false) })}
        />
      </DialogContent>
    </Dialog>
  );
}

interface CancelSubscriptionFormProps {
  periodEndsOn: string;
  isPending: boolean;
  onBack: () => void;
  onConfirm: (input: CancelSubscriptionInput) => void;
}

function CancelSubscriptionForm({
  periodEndsOn,
  isPending,
  onBack,
  onConfirm,
}: CancelSubscriptionFormProps) {
  const form = useForm<CancelSubscriptionInput>({
    resolver: zodResolver(cancelSubscriptionInputSchema),
    defaultValues: { reason: undefined, comments: "" },
  });
  const { errors } = useFormState({ control: form.control });
  const reason = useWatch({ control: form.control, name: "reason" });

  return (
    <form
      onSubmit={form.handleSubmit((values) =>
        onConfirm({
          reason: values.reason,
          // El comentario solo acompaña al motivo "Otro".
          ...(values.reason === "OTHER" && values.comments ? { comments: values.comments } : {}),
        }),
      )}
      className="space-y-4"
    >
      <DialogHeader className="text-left">
        <DialogTitle className="text-lg font-bold text-slate-900">Cancelar suscripción</DialogTitle>
        <DialogDescription className="text-sm text-slate-500">
          Cuéntanos por qué te vas. Nos ayuda a mejorar TripAgent.
        </DialogDescription>
      </DialogHeader>

      <Controller
        name="reason"
        control={form.control}
        render={({ field }) => (
          <RadioGroup
            value={field.value ?? ""}
            onValueChange={field.onChange}
            aria-label="Motivo de la cancelación"
            className="gap-2"
          >
            {SUBSCRIPTION_CANCELLATION_REASONS.map((option) => (
              <Label
                key={option}
                htmlFor={`cancel-reason-${option}`}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 has-[[data-state=checked]]:border-indigo-300 has-[[data-state=checked]]:bg-indigo-50"
              >
                <RadioGroupItem id={`cancel-reason-${option}`} value={option} />
                {SUBSCRIPTION_CANCELLATION_REASON_DICT[option]}
              </Label>
            ))}
          </RadioGroup>
        )}
      />
      {errors.reason && <p className="text-xs font-medium text-red-500">{errors.reason.message}</p>}

      {reason === "OTHER" && (
        <div className="space-y-1.5">
          <Label htmlFor="cancel-comments" className="text-sm text-slate-600">
            Cuéntanos más <span className="font-normal text-slate-400">(opcional)</span>
          </Label>
          <Textarea
            id="cancel-comments"
            rows={3}
            maxLength={SUBSCRIPTION_CANCELLATION_COMMENT_MAX}
            className="text-base sm:text-sm"
            {...form.register("comments")}
          />
          {errors.comments && (
            <p className="text-xs font-medium text-red-500">{errors.comments.message}</p>
          )}
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-amber-950">
          Tu suscripción seguirá activa hasta el{" "}
          <strong className="font-semibold">{periodEndsOn}</strong>. Después de esa fecha, tu cuenta
          pasará a Modo Solo Lectura para que puedas consultar tu historial sin perder información.
        </p>
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={isPending}>
          Volver
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-red-600 text-white hover:bg-red-700"
        >
          {isPending ? "Cancelando..." : "Confirmar cancelación"}
        </Button>
      </DialogFooter>
    </form>
  );
}

import { apiClient, ApiError } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PaymentInput,
  PaymentOutput,
  VoidPaymentInput,
  VoidPaymentOutput,
} from "../schemas/payment.schema";
import { invalidateBookingChange } from "@/shared/api/invalidate-booking-change";
import { PAYMENT_TYPE } from "@/shared/constants/domain.constants";

const createPaymentApi = ({ bookingId, payload: data }: PaymentInput): Promise<PaymentOutput> => {
  return apiClient.post<PaymentOutput, never>(`/payments/${bookingId}/payments`, data);
};

const voidPaymentApi = ({ bookingId, paymentId, data }: VoidPaymentInput): Promise<unknown> => {
  return apiClient.post<VoidPaymentOutput, never>(
    `/payments/${bookingId}/payments/${paymentId}/void`,
    data,
  );
};

export const useCreatePayment = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPaymentApi,
    onSuccess: (_data, { payload }) => {
      invalidateBookingChange(queryClient, tourId);
      toast.success(
        payload.type === PAYMENT_TYPE.REFUND
          ? "Reembolso registrado correctamente"
          : "Abono registrado correctamente",
      );
    },
    onError: (error: ApiError, { payload }) => {
      toast.error(
        payload.type === PAYMENT_TYPE.REFUND
          ? "Error al registrar el reembolso"
          : "Error al registrar el abono",
        {
          description: error.message || "Revisa los datos e intenta de nuevo.",
        },
      );
    },
  });
};

export const useVoidPayment = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: voidPaymentApi,
    onSuccess: () => {
      invalidateBookingChange(queryClient, tourId);
      toast.success("Abono anulado exitosamente");
    },
    onError: (error: ApiError) => {
      toast.error("Error al anular el abono", {
        description: error.message || "No se pudo anular el registro.",
      });
    },
  });
};

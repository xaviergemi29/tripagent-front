import { apiClient, ApiError } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PaymentInput,
  PaymentOutput,
  VoidPaymentInput,
  VoidPaymentOutput,
} from "../schemas/payment.schema";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour-dashboard", tourId] });
      toast.success("Abono registrado correctamente");
    },
    onError: (error: ApiError) => {
      toast.error("Error al registrar el abono", {
        description: error.message || "Revisa los datos e intenta de nuevo.",
      });
    },
  });
};

export const useVoidPayment = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: voidPaymentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour-dashboard", tourId] });
      toast.success("Abono anulado exitosamente");
    },
    onError: (error: ApiError) => {
      toast.error("Error al anular el abono", {
        description: error.message || "No se pudo anular el registro.",
      });
    },
  });
};

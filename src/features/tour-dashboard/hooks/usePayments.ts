import { PaymentFormValues } from "@/features/travelers/schemas/enrollTravelerSchema";
import { apiClient } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CreatePaymentVariables {
  bookingId: string;
  payload: PaymentFormValues;
}

interface VoidPaymentVariables {
  bookingId: string;
  paymentId: string;
  data: { reason: string };
}

const createPaymentApi = ({
  bookingId,
  payload: data,
}: CreatePaymentVariables): Promise<unknown> => {
  return apiClient.post(`/payments/${bookingId}/payments`, data);
};

const voidPaymentApi = ({ bookingId, paymentId, data }: VoidPaymentVariables): Promise<unknown> => {
  return apiClient.post(`/payments/${bookingId}/payments/${paymentId}/void`, data);
};

export const useCreatePayment = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPaymentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour-dashboard", tourId] });
      toast.success("Abono registrado correctamente");
    },
    onError: (error: Error) => {
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
    onError: (error: Error) => {
      toast.error("Error al anular el abono", {
        description: error.message || "No se pudo anular el registro.",
      });
    },
  });
};

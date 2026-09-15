import { PaymentFormValues } from "@/features/travelers/schemas/enrollTravelerSchema";
import { apiClient } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner";

interface CreatePaymentVariables {
  bookingId: string;
  payload: PaymentFormValues;
}

const createPayment = ({bookingId, payload: data}: CreatePaymentVariables): Promise<any> => {
    return apiClient.post(`/payments/${bookingId}/payments`, data)
}

export const useCreatePayment = (tourId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tour-dashboard", tourId] });
            toast.success("Abono registrado correctamente");
        },
        onError: (error: Error) => {
            toast.error("Error al registrar el abono", {
                description: error.message || "Revisa los datos e intenta de nuevo.",
            });
        }
    })
}
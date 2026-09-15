import { apiClient } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookingInput, BookingOutput } from "../schemas/bookingSchema";

// ============================================================================
// 1. QUERY KEY FACTORY (Patrón de Arquitectura Limpia)
// ============================================================================
export const BOOKING_KEYS = {
    all: ["bookings"] as const,
    lists: (search?: string) => [...BOOKING_KEYS.all, { search }] as const,
    detail: (id: string) => [...BOOKING_KEYS.all, "detail", id] as const,
};

// ============================================================================
// 2. INTERFACES INTERNAS (Patrón de "Usa TS puro para contratos internos")
// ============================================================================
export interface CancelPassengerPayload {
    bookingId: string;
    travelerId: string;
    penaltyAmount: number
}

interface QuickBookingPayload {
    fullName: string;
    whatsapp: string;
    email: string;
    numberPassengers: number;
}

interface QuickBookingResponse {
    bookingId: string;
    token: string;
    availableSeats: number;
}

// ============================================================================
// 3. CAPA DE RED (Axios API Client)
// ============================================================================
const createBookingApi = async (bookingData: BookingInput): Promise<BookingOutput> => {
    return apiClient.post<never, BookingOutput>(`/bookings`, bookingData);
};

const cancelPassengerApi = async ({ bookingId, travelerId, penaltyAmount }: CancelPassengerPayload): Promise<any> => {
    // Asegúrate de que tu Backend también espere penaltyAmount
    return apiClient.patch<never, any>(`/bookingPassengers/${bookingId}/passengers/${travelerId}/cancel`, {
        penaltyAmount, 
    });
}

const createQuickBookingApi = async ({ tourId, payload }: { tourId: string; payload: QuickBookingPayload }) => {
    return await apiClient.post<never, QuickBookingResponse>(`/bookings/${tourId}/quick-booking`, payload);
};

// ============================================================================
// 4. HOOKS DE MUTACIONES
// ============================================================================

export const useCreateBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBookingApi,
        onSuccess: (data, variables) => {
            toast.success("Registro creado exitosamente");
            console.log("data", data)
            console.log("variables", variables)
            // queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
            // if (variables?.tourId) {
            //     queryClient.invalidateQueries({ queryKey: ["tour-dashboard", variables.tourId] });
            // }
            queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });

        },
        onError: (error: Error) => {
            toast.error("Error al crear la reserva", {
                description: error.message || "No se pudo guardar la información",
            });
        }
    });
}

export const useCancelPassenger = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: cancelPassengerApi,
        onSuccess: () => {
            toast.success("Viajero cancelado exitosamente");
            // 🔄 FIX: Invalidamos el dashboard y las listas para que repinte al instante
            queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
            // Adicionalmente, invalidamos explícitamente el dashboard si usas esa key en otro lado
            queryClient.invalidateQueries({ queryKey: ["tour-dashboard"] });
        },
        onError: (error: Error) => {
            toast.error("Error al cancelar el pasajero", {
                description: error.message || "No se pudo cancelar el pasajero",
            });
        }
    });
}

export function useQuickReservation(tourId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: QuickBookingPayload) => createQuickBookingApi({ tourId, payload }),
        onSuccess: () => {
            // Invalidamos el dashboard del tour para que el termómetro de ocupación y las métricas se actualicen en tiempo real
            queryClient.invalidateQueries({ queryKey: ["tours", "detail", tourId] });
            toast.success("Lugares apartados exitosamente");
        },
        onError: (error: Error) => {
            toast.error("Error al apartar lugares", {
                description: error?.message || "Error al generar la reserva rápida",
            });
        },
    });
}
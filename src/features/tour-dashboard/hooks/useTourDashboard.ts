import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TourDashboardOutput, VehicleOutput } from "../schemas/tour-dashboard.schema";
import { apiClient, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { TOUR_SEAT_KEYS } from "@/features/tours/hooks/useTourSeats";
import type {
  TransferPassengerInput,
  TransferPassengerOutput,
} from "../schemas/transfer-passenger.schema";

// ============================================================================
// 0. QUERY KEY FACTORIES
// ============================================================================
export const TOUR_DASHBOARD_KEYS = {
  all: ["tour-dashboard"] as const,
  detail: (tourId: string) => [...TOUR_DASHBOARD_KEYS.all, tourId] as const,
};

export const VEHICLE_KEYS = {
  all: ["vehicles"] as const,
};

/** Se envía una unidad de la agencia (`vehicleId`) o una plantilla del catálogo (`templateId`). */
export type AssignVehicleInput =
  | { tourId: string; vehicleId: string; templateId?: never }
  | { tourId: string; templateId: string; vehicleId?: never };

/** Respuesta (ya desenvuelta) de `PATCH /tours/:id/vehicle`: el tour + asientos liberados. */
interface AssignVehicleOutput {
  id: string;
  vehicleId: string | null;
  releasedSeats?: { passengers: number; blocked: number };
}

// ============================================================================
// 1. CAPA DE RED (Axios API Client)
// ============================================================================
const fetchDashboardByTourIdApi = async (tourId: string): Promise<TourDashboardOutput> => {
  return apiClient.get<never, TourDashboardOutput>(`/dashboards/${tourId}`);
};

const fetchVehiclesApi = async (): Promise<VehicleOutput[]> => {
  return apiClient.get<never, VehicleOutput[]>(`/vehicles`);
};

// ============================================================================
// 2. HOOKS DE QUERIES (Lectura)
// ============================================================================
export function useTourDashboardByTourId(tourId: string) {
  return useQuery({
    queryKey: TOUR_DASHBOARD_KEYS.detail(tourId),
    queryFn: () => fetchDashboardByTourIdApi(tourId),
    enabled: !!tourId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
export function useVehicles() {
  return useQuery({
    queryKey: VEHICLE_KEYS.all,
    queryFn: fetchVehiclesApi,
  });
}

// ============================================================================
// 3. HOOKS DE MUTACIONES (Escritura y Optimistic UI)
// ============================================================================
export function useAssignVehicleToTour() {
  const queryClient = useQueryClient();

  return useMutation({
    // La API libera siempre los asientos y bloqueos cuya etiqueta no existe en el nuevo layout
    // y responde 409 si el vehículo no alcanza para los pasajeros con derecho a asiento.
    mutationFn: ({ tourId, vehicleId, templateId }: AssignVehicleInput) =>
      apiClient.patch<never, AssignVehicleOutput>(
        `/tours/${tourId}/vehicle`,
        templateId ? { templateId } : { vehicleId },
      ),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TOUR_DASHBOARD_KEYS.detail(variables.tourId) });
      // Con templateId la API pudo crear la unidad de la agencia para esa plantilla.
      queryClient.invalidateQueries({ queryKey: VEHICLE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TOUR_SEAT_KEYS.byTour(variables.tourId) });

      const released = data?.releasedSeats;
      const parts = [
        released?.passengers
          ? `${released.passengers} pasajero(s) volvieron a "Faltan por acomodar"`
          : null,
        released?.blocked ? `${released.blocked} bloqueo(s) de staff se quitaron` : null,
      ].filter(Boolean);
      toast.success("Vehículo asignado y mapa actualizado", {
        description: parts.length
          ? `${parts.join(" y ")} porque su asiento no existe en la nueva unidad.`
          : undefined,
      });
    },
    onError: (error: ApiError) => {
      toast.error("Error al asignar el vehículo", {
        description: error.message || "No se pudo completar la asignación",
      });
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; layoutMap: (string | null)[][] }) =>
      apiClient.post("/vehicles", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_KEYS.all });
      toast.success("Plantilla de vehículo creada");
    },
    onError: (error: ApiError) => {
      toast.error("Error al crear la plantilla", {
        description: error.message || "No se pudo crear la plantilla",
      });
    },
  });
}

export function useAddPassengerToBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, tourId }: { bookingId: string; tourId: string }) =>
      apiClient.post(`/bookings/${bookingId}/add-passenger`, { tourId }),
    onSuccess: (_, variables) => {
      // Invalidar para actualizar métricas financieras y tamaño de grupo
      queryClient.invalidateQueries({ queryKey: TOUR_DASHBOARD_KEYS.all });
      toast.success("Acompañante agregado", {
        description: "El saldo pendiente ha sido ajustado.",
      });
    },
    onError: (error: ApiError) => {
      toast.error("Error al agregar pasajero", {
        description: error.message || "Verifica la disponibilidad de lugares.",
      });
    },
  });
}

export function useRemovePendingSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string }) =>
      apiClient.delete(`/bookings/${bookingId}/pending-slots`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOUR_DASHBOARD_KEYS.all });
      toast.success("Cupo liberado", {
        description: "El lugar ha regresado al inventario y el saldo se ajustó.",
      });
    },
    onError: (error: ApiError) => {
      toast.error("Error al eliminar el acompañante", {
        description: error.message || "No se pudo eliminar el acompañante",
      });
    },
  });
}

/**
 * Transferencia de un lugar (titular o acompañante) a otra persona.
 * Si el titular cambia de WhatsApp, la API regenera el Magic Link (`tokenRegenerated`).
 */
export function useTransferPassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: TransferPassengerInput }) =>
      apiClient.patch<never, TransferPassengerOutput>(`/bookings/${bookingId}/transfer`, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: TOUR_DASHBOARD_KEYS.detail(result.tourId) });
      toast.success(
        result.transferredPassenger.role === "TITULAR"
          ? "Titularidad transferida"
          : "Lugar transferido",
        {
          description: result.tokenRegenerated
            ? "Se generó un nuevo Magic Link; el enlace anterior ya no funciona."
            : undefined,
        },
      );
    },
    onError: (error: ApiError) => {
      toast.error("No se pudo transferir el lugar", {
        description: error.message || "Ocurrió un error al procesar la transferencia",
      });
    },
  });
}

// Nota: Esta es una simplificación UX de tu lógica previa de "CancelPassenger"
// que requiere penalización manual. Aquí asumimos la baja rápida o conectamos a tu hook existente.
export function useQuickRemovePassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, passengerId }: { bookingId: string; passengerId: string }) =>
      apiClient.patch(`/bookingPassengers/${bookingId}/passengers/${passengerId}/cancel`, {
        penaltyAmount: 0, // Simplificado para UX rápida, si necesitas penalty, abre el Drawer en su lugar.
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOUR_DASHBOARD_KEYS.all });
      toast.success("Pasajero dado de baja", {
        description: "El asiento ha sido liberado.",
      });
    },
    onError: (error: ApiError) => {
      toast.error("Error al dar de baja", {
        description: error.message || "No se pudo cancelar al pasajero.",
      });
    },
  });
}

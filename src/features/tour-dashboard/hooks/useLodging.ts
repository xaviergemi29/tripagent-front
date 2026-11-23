import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, type ApiError } from "@/lib/api-client";
import { LODGING_KEYS } from "@/shared/api/query-keys";
import { removeBedFromRoom, removeRoomFromLodging } from "../utils/lodging.util";
import type {
  AssignLodgingRoomInput,
  DeleteLodgingBedOutput,
  DeleteLodgingRoomOutput,
  LodgingOutput,
  LodgingRoomOutput,
  LodgingRoomResultOutput,
  RegisterLodgingRoomsInput,
  RegisterLodgingRoomsOutput,
  UpdateLodgingRoomInput,
} from "../schemas/lodging.schema";

/** Hoteles y habitaciones del tour (pestaña Hospedaje). */
export function useTourLodging(tourId: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: LODGING_KEYS.detail(tourId),
    queryFn: () => apiClient.get<never, LodgingOutput>(`/lodging/${tourId}`),
    enabled: enabled && !!tourId,
    retry: 1,
  });
}

/**
 * Registra habitaciones en un hotel (nuevo o existente del tour). La API decide la capacidad y la
 * numeración; el tablero se refresca con la invalidación.
 */
export function useRegisterLodgingRooms(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation<RegisterLodgingRoomsOutput, ApiError, RegisterLodgingRoomsInput>({
    mutationFn: (data) =>
      apiClient.post<never, RegisterLodgingRoomsOutput>(`/lodging/${tourId}/rooms`, data),
    onSuccess: ({ hotel, createdRooms, createdCapacity }) => {
      void queryClient.invalidateQueries({ queryKey: LODGING_KEYS.detail(tourId) });
      toast.success(`Habitaciones agregadas a ${hotel.name}`, {
        description: `${createdRooms} ${createdRooms === 1 ? "habitación" : "habitaciones"} (${createdCapacity} lugares)`,
      });
    },
    onError: (error) => {
      toast.error("No se pudieron agregar las habitaciones", { description: error.message });
    },
  });
}

/**
 * Cambia el hospedaje en la caché de inmediato y devuelve la foto anterior para el rollback.
 * La respuesta de la API (o la invalidación posterior) deja el estado definitivo.
 */
async function applyOptimisticLodging(
  queryClient: QueryClient,
  tourId: string,
  change: (lodging: LodgingOutput) => LodgingOutput,
) {
  const queryKey = LODGING_KEYS.detail(tourId);
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData<LodgingOutput>(queryKey);
  if (previous) queryClient.setQueryData<LodgingOutput>(queryKey, change(previous));
  return { previous };
}

const applyOptimisticRoom = (
  queryClient: QueryClient,
  tourId: string,
  roomId: string,
  change: (room: LodgingRoomOutput) => LodgingRoomOutput,
) =>
  applyOptimisticLodging(queryClient, tourId, (lodging) => ({
    ...lodging,
    hotels: lodging.hotels.map((hotel) => ({
      ...hotel,
      rooms: hotel.rooms.map((room) => (room.id === roomId ? change(room) : room)),
    })),
  }));

interface LodgingMutationContext {
  previous: LodgingOutput | undefined;
}

/** Hooks de las mutaciones de habitación: mismo rollback, toast e invalidación. */
function useLodgingRoomMutation<
  TVariables extends { roomId: string },
  TResult extends LodgingRoomResultOutput = LodgingRoomResultOutput,
>(
  tourId: string,
  {
    request,
    optimistic,
    errorTitle,
    onSuccess,
  }: {
    request: (variables: TVariables) => Promise<TResult>;
    optimistic: (room: LodgingRoomOutput, variables: TVariables) => LodgingRoomOutput;
    errorTitle: string;
    onSuccess?: (result: TResult) => void;
  },
) {
  const queryClient = useQueryClient();

  return useMutation<TResult, ApiError, TVariables, LodgingMutationContext>({
    mutationFn: request,
    onSuccess,
    onMutate: (variables) =>
      applyOptimisticRoom(queryClient, tourId, variables.roomId, (room) =>
        optimistic(room, variables),
      ),
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(LODGING_KEYS.detail(tourId), context.previous);
      }
      toast.error(errorTitle, { description: error.message });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: LODGING_KEYS.detail(tourId) });
    },
  });
}

/** Número de cuarto y/o estado de una habitación. */
export function useUpdateLodgingRoom(tourId: string) {
  return useLodgingRoomMutation<{ roomId: string } & UpdateLodgingRoomInput>(tourId, {
    request: ({ roomId, ...body }) =>
      apiClient.patch<never, LodgingRoomResultOutput>(`/lodging/${tourId}/rooms/${roomId}`, body),
    optimistic: (room, { roomNumber, status }) => ({
      ...room,
      roomNumber: roomNumber === undefined ? room.roomNumber : roomNumber?.trim() || null,
      status: status ?? room.status,
    }),
    errorTitle: "No se pudo actualizar la habitación",
  });
}

/** Asigna uno o varios pasajeros a camas de una habitación (la pareja en una sola llamada). */
export function useAssignLodgingRoom(tourId: string) {
  return useLodgingRoomMutation<{ roomId: string } & AssignLodgingRoomInput>(tourId, {
    request: ({ roomId, assignments }) =>
      apiClient.post<never, LodgingRoomResultOutput>(
        `/lodging/${tourId}/rooms/${roomId}/assignments`,
        { assignments },
      ),
    optimistic: (room, { assignments }) => ({
      ...room,
      slots: [...room.slots, ...assignments],
    }),
    errorTitle: "No se pudo asignar la cama",
  });
}

/** Libera una cama: el pasajero vuelve a "sin habitación". */
export function useUnassignLodgingSlot(tourId: string) {
  return useLodgingRoomMutation<{ roomId: string; slotIndex: number }>(tourId, {
    request: ({ roomId, slotIndex }) =>
      apiClient.delete<never, LodgingRoomResultOutput>(
        `/lodging/${tourId}/rooms/${roomId}/slots/${slotIndex}`,
      ),
    optimistic: (room, { slotIndex }) => ({
      ...room,
      slots: room.slots.filter((slot) => slot.slotIndex !== slotIndex),
    }),
    errorTitle: "No se pudo liberar la cama",
  });
}

/** Elimina una cama (baja la capacidad y recorre las siguientes); su pasajero queda sin cama. */
export function useDeleteLodgingBed(tourId: string) {
  return useLodgingRoomMutation<{ roomId: string; slotIndex: number }, DeleteLodgingBedOutput>(
    tourId,
    {
      request: ({ roomId, slotIndex }) =>
        apiClient.delete<never, DeleteLodgingBedOutput>(
          `/lodging/${tourId}/rooms/${roomId}/beds/${slotIndex}`,
        ),
      optimistic: (room, { slotIndex }) => removeBedFromRoom(room, slotIndex),
      errorTitle: "No se pudo eliminar la cama",
      onSuccess: ({ releasedPassenger }) =>
        toast.success("Cama eliminada", {
          description: releasedPassenger
            ? 'El pasajero regresó a "Pasajeros sin habitación"'
            : undefined,
        }),
    },
  );
}

/** Elimina una habitación completa; sus pasajeros regresan a "sin habitación". */
export function useDeleteLodgingRoom(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation<DeleteLodgingRoomOutput, ApiError, { roomId: string }, LodgingMutationContext>(
    {
      mutationFn: ({ roomId }) =>
        apiClient.delete<never, DeleteLodgingRoomOutput>(`/lodging/${tourId}/rooms/${roomId}`),
      onMutate: ({ roomId }) =>
        applyOptimisticLodging(queryClient, tourId, (lodging) =>
          removeRoomFromLodging(lodging, roomId),
        ),
      onSuccess: ({ releasedPassengers }) =>
        toast.success("Habitación eliminada", {
          description:
            releasedPassengers > 0
              ? `${releasedPassengers} ${releasedPassengers === 1 ? "pasajero regresó" : "pasajeros regresaron"} a "Pasajeros sin habitación"`
              : undefined,
        }),
      onError: (error, _variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(LODGING_KEYS.detail(tourId), context.previous);
        }
        toast.error("No se pudo eliminar la habitación", { description: error.message });
      },
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: LODGING_KEYS.detail(tourId) });
      },
    },
  );
}

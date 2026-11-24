import {
  useIsFetching,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, type ApiError } from "@/lib/api-client";
import { LODGING_KEYS, MUTATION_KEYS } from "@/shared/api/query-keys";
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
    mutationKey: MUTATION_KEYS.lodgingChange(tourId),
    mutationFn: (data) =>
      apiClient.post<never, RegisterLodgingRoomsOutput>(`/lodging/${tourId}/rooms`, data),
    onSuccess: ({ hotel, createdRooms, createdCapacity }) => {
      toast.success(`Habitaciones agregadas a ${hotel.name}`, {
        description: `${createdRooms} ${createdRooms === 1 ? "habitación" : "habitaciones"} (${createdCapacity} lugares)`,
      });
    },
    onError: (error) => {
      toast.error("No se pudieron agregar las habitaciones", { description: error.message });
    },
    onSettled: () => refreshLodgingWhenIdle(queryClient, tourId),
  });
}

/**
 * Recarga el hospedaje solo cuando esta es la última mutación en curso del tour: con otra en vuelo,
 * la recarga traería un estado sin ese cambio y pisaría su actualización optimista (parpadeo). La
 * promesa devuelta mantiene la mutación `pending` hasta que llegan los datos frescos, así el
 * tablero sigue marcado como "actualizando" y no hay un instante con datos intermedios.
 */
function refreshLodgingWhenIdle(queryClient: QueryClient, tourId: string): Promise<void> {
  const inFlight = queryClient.isMutating({ mutationKey: MUTATION_KEYS.lodgingChange(tourId) });
  if (inFlight > 1) return Promise.resolve();
  return queryClient.invalidateQueries({ queryKey: LODGING_KEYS.detail(tourId) });
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

/**
 * Regresa la foto anterior solo si no hay otra mutación en vuelo (restaurarla borraría su cambio
 * optimista); en ese caso la recarga final deja la caché igual que la API.
 */
function restoreLodging(
  queryClient: QueryClient,
  tourId: string,
  context: LodgingMutationContext | undefined,
) {
  const inFlight = queryClient.isMutating({ mutationKey: MUTATION_KEYS.lodgingChange(tourId) });
  if (context?.previous && inFlight <= 1) {
    queryClient.setQueryData(LODGING_KEYS.detail(tourId), context.previous);
  }
}

/** Un 404 o 409 significa que el tablero estaba desactualizado (la recarga lo corrige). */
function describeLodgingError(error: ApiError): string {
  if (error.status === 404 || error.status === 409) {
    return `${error.message.replace(/\.$/, "")}. El tablero se actualizó; revisa y vuelve a intentarlo.`;
  }
  return error.message;
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
    mutationKey: MUTATION_KEYS.lodgingChange(tourId),
    mutationFn: request,
    onSuccess,
    onMutate: (variables) =>
      applyOptimisticRoom(queryClient, tourId, variables.roomId, (room) =>
        optimistic(room, variables),
      ),
    onError: (error, _variables, context) => {
      restoreLodging(queryClient, tourId, context);
      toast.error(errorTitle, { description: describeLodgingError(error) });
    },
    onSettled: () => refreshLodgingWhenIdle(queryClient, tourId),
  });
}

/** Número de cuarto de una habitación. */
export function useUpdateLodgingRoom(tourId: string) {
  return useLodgingRoomMutation<{ roomId: string } & UpdateLodgingRoomInput>(tourId, {
    request: ({ roomId, ...body }) =>
      apiClient.patch<never, LodgingRoomResultOutput>(`/lodging/${tourId}/rooms/${roomId}`, body),
    optimistic: (room, { roomNumber }) => ({
      ...room,
      roomNumber: roomNumber === undefined ? room.roomNumber : roomNumber?.trim() || null,
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

/** Elimina la cama completa del lugar (matrimonial = 2 lugares): baja la capacidad, recorre los siguientes y sus pasajeros quedan sin cama. */
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
      onSuccess: ({ releasedPassenger, releasedPassengers }) => {
        const released = releasedPassengers || (releasedPassenger ? 1 : 0);
        toast.success("Cama eliminada", {
          description:
            released > 0
              ? `${released} ${released === 1 ? "pasajero regresó" : "pasajeros regresaron"} a "Pasajeros sin habitación"`
              : undefined,
        });
      },
    },
  );
}

/** Elimina una habitación completa; sus pasajeros regresan a "sin habitación". */
export function useDeleteLodgingRoom(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation<DeleteLodgingRoomOutput, ApiError, { roomId: string }, LodgingMutationContext>(
    {
      mutationKey: MUTATION_KEYS.lodgingChange(tourId),
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
        restoreLodging(queryClient, tourId, context);
        toast.error("No se pudo eliminar la habitación", {
          description: describeLodgingError(error),
        });
      },
      onSettled: () => refreshLodgingWhenIdle(queryClient, tourId),
    },
  );
}

interface LodgingActivity {
  /** Habitaciones con una mutación en curso: sus acciones se bloquean hasta que la API responde. */
  busyRoomIds: ReadonlySet<string>;
  /** Habitaciones que se están registrando por hotel (marcadores mientras llegan los datos). */
  registeringRooms: { hotelName: string; count: number }[];
  /** Hay una mutación o una recarga del hospedaje en curso. */
  isUpdating: boolean;
}

interface PendingLodgingChange {
  roomId?: string;
  hotelName?: string;
  rooms?: { quantity: number }[];
}

/**
 * Qué se está actualizando en el hospedaje, derivado en el render: las mutaciones siguen
 * `pending` hasta que llega la recarga (ver `refreshLodgingWhenIdle`), así que no hace falta
 * estado propio.
 */
export function useLodgingActivity(tourId: string): LodgingActivity {
  const pending = useMutationState<PendingLodgingChange>({
    filters: { mutationKey: MUTATION_KEYS.lodgingChange(tourId), status: "pending" },
    select: (mutation) => (mutation.state.variables ?? {}) as PendingLodgingChange,
  });
  const fetching = useIsFetching({ queryKey: LODGING_KEYS.detail(tourId) });

  const busyRoomIds = new Set<string>();
  const registeringRooms: LodgingActivity["registeringRooms"] = [];
  for (const change of pending) {
    if (change.roomId) busyRoomIds.add(change.roomId);
    if (change.hotelName && change.rooms) {
      registeringRooms.push({
        hotelName: change.hotelName,
        count: change.rooms.reduce((total, item) => total + item.quantity, 0),
      });
    }
  }
  return { busyRoomIds, registeringRooms, isUpdating: pending.length > 0 || fetching > 0 };
}

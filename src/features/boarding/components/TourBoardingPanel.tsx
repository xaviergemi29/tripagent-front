"use client";

import { QueryErrorState } from "@/components/shared/QueryErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { MinorTravelAlert } from "@/components/shared/MinorTravelAlert";
import { TOUR_TEMPORAL_STATUS } from "@/shared/constants/domain.constants";
import { useSetTourBoarding, useTourBoarding } from "../hooks/useBoarding";
import { BoardingList } from "./BoardingList";

interface TourBoardingPanelProps {
  tourId: string;
  /** Modo Auditoría o Solo Lectura por suscripción (calculado en `TourDashboardView`). */
  readOnly: boolean;
}

/** Pestaña "Abordaje" del Centro de Control: pase de lista con sesión (RB-MAN-002). */
export function TourBoardingPanel({ tourId, readOnly }: TourBoardingPanelProps) {
  const { data, isLoading, isError, refetch, isFetching } = useTourBoarding(tourId);
  const { mutate } = useSetTourBoarding(tourId);

  if (isError && !data) {
    return (
      <QueryErrorState
        resourceArticle="la"
        resourceName="lista de abordaje"
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div role="status" aria-label="Cargando lista de abordaje" className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const canMark = data.canMarkBoarding && !readOnly;
  const readOnlyMessage = canMark
    ? undefined
    : data.temporalStatus === TOUR_TEMPORAL_STATUS.FINISHED
      ? "El tour ya finalizó: la lista es de solo consulta."
      : data.temporalStatus === TOUR_TEMPORAL_STATUS.CANCELLED
        ? "El tour fue cancelado: la lista es de solo consulta."
        : "Tu cuenta está en modo solo lectura: puedes consultar la lista, pero no marcar el abordaje.";

  return (
    <div className="space-y-3">
      {data.hasMinors && <MinorTravelAlert />}
      <BoardingList
        items={data.passengers.map((passenger) => ({ ...passenger, id: passenger.travelerId }))}
        boardingPoints={data.boardingPoints}
        temporalStatus={data.temporalStatus}
        onToggle={canMark ? (id, boarded) => mutate({ id, boarded }) : undefined}
        readOnlyMessage={readOnlyMessage}
      />
    </div>
  );
}

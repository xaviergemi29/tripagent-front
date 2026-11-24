"use client";

import { TOUR_TEMPORAL_STATUS } from "@/shared/constants/domain.constants";
import type { StaffBoardingOutput } from "../schemas/boarding.schema";
import { useSetStaffBoarding, useStaffBoarding } from "../hooks/useBoarding";
import { BoardingList } from "./BoardingList";

interface StaffBoardingPanelProps {
  token: string;
  /** Lista que trajo el Server Component en esta carga (datos planos). */
  initialData: StaffBoardingOutput;
}

/** Pase de lista del coordinador en `/s/[token]` (sin sesión, RB-MAN-002). */
export function StaffBoardingPanel({ token, initialData }: StaffBoardingPanelProps) {
  const { data } = useStaffBoarding(token, initialData);
  const { mutate } = useSetStaffBoarding(token);

  const readOnlyMessage = data.canMarkBoarding
    ? undefined
    : data.temporalStatus === TOUR_TEMPORAL_STATUS.FINISHED ||
        data.temporalStatus === TOUR_TEMPORAL_STATUS.CANCELLED
      ? "El viaje ya terminó: la lista es de solo consulta."
      : "La agencia pausó los cambios: puedes consultar la lista, pero no marcar el abordaje.";

  return (
    <BoardingList
      items={data.passengers.map((passenger) => ({ ...passenger, id: passenger.boardingKey }))}
      boardingPoints={data.boardingPoints}
      temporalStatus={data.temporalStatus}
      onToggle={data.canMarkBoarding ? (id, boarded) => mutate({ id, boarded }) : undefined}
      readOnlyMessage={readOnlyMessage}
    />
  );
}

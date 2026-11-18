import type { TourOutput } from "../schemas/tour.schema";
import { TOUR_TEMPORAL_STATUS } from "@/shared/constants/domain.constants";

/**
 * Modo Auditoría (regla 9 de `../CLAUDE.md`, OBS-004): un tour FINALIZADO o CANCELADO es de solo
 * consulta. El listado no ofrece "Editar Tour" ni "Compartir folleto" y la página de edición no
 * muestra el formulario; la API responde 409 a cualquier cambio.
 */
export const isTourReadOnly = (tour: Pick<TourOutput, "temporalStatus">): boolean =>
  tour.temporalStatus === TOUR_TEMPORAL_STATUS.CANCELLED ||
  tour.temporalStatus === TOUR_TEMPORAL_STATUS.FINISHED;

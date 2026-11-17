import { useState, useMemo } from "react";
import { matchesSearch } from "@/shared/utils/search.util";
import type { TourOutput } from "../schemas/tour.schema";
import {
  TOUR_TEMPORAL_STATUS,
  DESTINATION_TYPE,
  CURRENCY,
} from "@/shared/constants/domain.constants";

// "CANCELLED" (2026-11-16): antes un tour cancelado solo aparecía en "Todos" y en ningún contador.
export type StatusFilter = "ALL" | "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type DestinationFilter = "ALL" | "NATIONAL" | "INTERNATIONAL";

export function useTourFilters(tours: TourOutput[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [destinationFilter, setDestinationFilter] = useState<DestinationFilter>("ALL");

  const filteredTours = useMemo(() => {
    if (!tours) return [];

    return tours.filter((tour) => {
      // 1. Filtro por Búsqueda (Texto)
      const matchSearch = matchesSearch(searchTerm, { texts: [tour.title] }); // sin acentos

      // 2. Filtro por Estado Temporal
      let matchStatus = true;
      if (statusFilter !== "ALL") {
        const status = tour.temporalStatus || TOUR_TEMPORAL_STATUS.UPCOMING;
        if (statusFilter === "UPCOMING") matchStatus = status === TOUR_TEMPORAL_STATUS.UPCOMING;
        if (statusFilter === "IN_PROGRESS")
          matchStatus = status === TOUR_TEMPORAL_STATUS.IN_PROGRESS;
        if (statusFilter === "COMPLETED") matchStatus = status === TOUR_TEMPORAL_STATUS.FINISHED;
        if (statusFilter === "CANCELLED") matchStatus = status === TOUR_TEMPORAL_STATUS.CANCELLED;
      }

      // 3. Filtro por Destino (Asumiendo campo destinationType o divisa como fallback)
      let matchDest = true;
      if (destinationFilter !== "ALL") {
        // Ajusta la propiedad real de tu backend aquí
        const isInternational =
          tour.destinationType === DESTINATION_TYPE.INTERNATIONAL || tour.currency === CURRENCY.USD;
        if (destinationFilter === DESTINATION_TYPE.NATIONAL) matchDest = !isInternational;
        if (destinationFilter === DESTINATION_TYPE.INTERNATIONAL) matchDest = isInternational;
      }

      // Combinación aditiva estricta (AND)
      return matchSearch && matchStatus && matchDest;
    });
  }, [tours, searchTerm, statusFilter, destinationFilter]);

  // Contadores para los Badges en la UI
  const counts = useMemo(() => {
    return {
      all: tours.length,
      upcoming: tours.filter(
        (t) =>
          (t.temporalStatus || TOUR_TEMPORAL_STATUS.UPCOMING) === TOUR_TEMPORAL_STATUS.UPCOMING,
      ).length,
      inProgress: tours.filter((t) => t.temporalStatus === TOUR_TEMPORAL_STATUS.IN_PROGRESS).length,
      completed: tours.filter((t) => t.temporalStatus === TOUR_TEMPORAL_STATUS.FINISHED).length,
      cancelled: tours.filter((t) => t.temporalStatus === TOUR_TEMPORAL_STATUS.CANCELLED).length,
    };
  }, [tours]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    destinationFilter,
    setDestinationFilter,
    filteredTours,
    counts,
  };
}

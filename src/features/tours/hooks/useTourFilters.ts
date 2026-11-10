import { useState, useMemo } from "react";
import type { TourOutput } from "../schemas/tour.schema";

export type StatusFilter = "ALL" | "UPCOMING" | "IN_PROGRESS" | "COMPLETED";
export type DestinationFilter = "ALL" | "NATIONAL" | "INTERNATIONAL";

export function useTourFilters(tours: TourOutput[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [destinationFilter, setDestinationFilter] = useState<DestinationFilter>("ALL");

  const filteredTours = useMemo(() => {
    if (!tours) return [];

    return tours.filter((tour) => {
      // 1. Filtro por Búsqueda (Texto)
      const matchSearch =
        !searchTerm.trim() || tour.title.toLowerCase().includes(searchTerm.toLowerCase().trim());

      // 2. Filtro por Estado Temporal
      let matchStatus = true;
      if (statusFilter !== "ALL") {
        const status = tour.temporalStatus || "PRÓXIMO";
        if (statusFilter === "UPCOMING") matchStatus = status === "PRÓXIMO";
        if (statusFilter === "IN_PROGRESS") matchStatus = status === "EN_CURSO";
        if (statusFilter === "COMPLETED") matchStatus = status === "FINALIZADO";
      }

      // 3. Filtro por Destino (Asumiendo campo destinationType o divisa como fallback)
      let matchDest = true;
      if (destinationFilter !== "ALL") {
        // Ajusta la propiedad real de tu backend aquí
        const isInternational = tour.destinationType === "INTERNATIONAL" || tour.currency === "USD";
        if (destinationFilter === "NATIONAL") matchDest = !isInternational;
        if (destinationFilter === "INTERNATIONAL") matchDest = isInternational;
      }

      // Combinación aditiva estricta (AND)
      return matchSearch && matchStatus && matchDest;
    });
  }, [tours, searchTerm, statusFilter, destinationFilter]);

  // Contadores para los Badges en la UI
  const counts = useMemo(() => {
    return {
      all: tours.length,
      upcoming: tours.filter((t) => (t.temporalStatus || "PRÓXIMO") === "PRÓXIMO").length,
      inProgress: tours.filter((t) => t.temporalStatus === "EN_CURSO").length,
      completed: tours.filter((t) => t.temporalStatus === "FINALIZADO").length,
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

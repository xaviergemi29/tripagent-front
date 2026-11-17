import { useState, useMemo } from "react";
import { matchesSearch } from "@/shared/utils/search.util";
import type { TravelerTableRow } from "../components/TravelersTable"; // Ajusta la ruta a tu tabla
import type { TravelerFilterType } from "../components/TravelersFilters"; // Ajusta la ruta

export function useTravelersFilter(travelers: TravelerTableRow[] = []) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<TravelerFilterType>("all");

  const filteredTravelers = useMemo(() => {
    return travelers.filter((traveler) => {
      // 1. Filtro de búsqueda por texto (nombre o correo, sin acentos) o teléfono (solo dígitos)
      const matchesQuery = matchesSearch(searchQuery, {
        texts: [traveler.fullName, traveler.email],
        phones: [traveler.whatsappPhone],
      });

      // 2. Filtro categórico (Todos, Nacional, Internacional)
      let matchesFilter = true;
      if (activeFilter === "national") {
        matchesFilter = !!traveler.hasNationalTrips;
      } else if (activeFilter === "international") {
        matchesFilter = !!traveler.hasInternationalTrips;
      }

      // Combinación aditiva (AND)
      return matchesQuery && matchesFilter;
    });
  }, [travelers, searchQuery, activeFilter]);

  // Contadores dinámicos para los badges de la UI
  const counts = useMemo(() => {
    return {
      all: travelers.length,
      national: travelers.filter((t) => t.hasNationalTrips).length,
      international: travelers.filter((t) => t.hasInternationalTrips).length,
    };
  }, [travelers]);

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredTravelers,
    counts,
  };
}

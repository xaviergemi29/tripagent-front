import { useState, useMemo } from "react";
import type { TravelerTableRow } from "../components/TravelersTable"; // Ajusta la ruta a tu tabla
import type { TravelerFilterType } from "../components/TravelersFilters"; // Ajusta la ruta

export function useTravelersFilter(travelers: TravelerTableRow[] = []) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<TravelerFilterType>("all");

  const filteredTravelers = useMemo(() => {
    return travelers.filter((traveler) => {
      // 1. Filtro de búsqueda por texto (Nombre, Teléfono o Email)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        traveler.fullName.toLowerCase().includes(query) ||
        (traveler.whatsappPhone && traveler.whatsappPhone.includes(query)) ||
        (traveler.email && traveler.email.toLowerCase().includes(query));

      // 2. Filtro categórico (Todos, Nacional, Internacional)
      let matchesFilter = true;
      if (activeFilter === "national") {
        matchesFilter = !!traveler.hasNationalTrips;
      } else if (activeFilter === "international") {
        matchesFilter = !!traveler.hasInternationalTrips;
      }

      // Combinación aditiva (AND)
      return matchesSearch && matchesFilter;
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

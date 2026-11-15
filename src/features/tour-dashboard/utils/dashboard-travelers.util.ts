import type {
  CompanionOutput,
  FlattenedPassenger,
  TitularRowOutput,
} from "@/features/tour-dashboard/schemas/tour-dashboard.schema";

/**
 * Lógica de presentación del Centro de Control sobre la lista de grupos que entrega la API
 * (`GET /dashboards/:tourId`). No recalcula dinero ni reglas de negocio: solo filtra, aplana y
 * clasifica lo que ya viene calculado. Única implementación para escritorio y celular.
 */

export type PaymentFilter = "ALL" | "UNPAID" | "PARTIAL" | "PAID";
export type RegistrationFilter = "ALL" | "PENDING" | "COMPLETED";
export type SeatFilter = "ALL" | "UNASSIGNED" | "ASSIGNED";

export interface DashboardFilters {
  searchQuery: string;
  paymentFilter: PaymentFilter | string;
  formFilter: RegistrationFilter | string;
  seatFilter: SeatFilter | string;
}

export const EMPTY_DASHBOARD_FILTERS: DashboardFilters = {
  searchQuery: "",
  paymentFilter: "ALL",
  formFilter: "ALL",
  seatFilter: "ALL",
};

/** `paymentStatus` como texto: la API envía PARTIAL/REFUNDED aunque el schema del front aún
 * declare los valores antiguos (desfase documentado en ../CLAUDE.md, sección C). */
interface GroupPaymentInput {
  paymentStatus: string;
  paidAmount: number;
  balance: number;
}

/**
 * Estado de pago que se muestra para el grupo. Tolera estados antiguos del dashboard
 * (`ADVANCE`, `PENDING_VALIDATION`) y datos inconsistentes: con dinero abonado y sin saldo cuenta
 * como pagado; con cualquier abono, como parcial.
 */
export function resolveGroupPaymentStatus({
  paymentStatus,
  paidAmount,
  balance,
}: GroupPaymentInput): Exclude<PaymentFilter, "ALL"> {
  if (paymentStatus === "PAID" || (paidAmount > 0 && balance <= 0)) return "PAID";
  if (paidAmount > 0 || ["ADVANCE", "PARTIAL", "PENDING_VALIDATION"].includes(paymentStatus)) {
    return "PARTIAL";
  }
  return "UNPAID";
}

const matchesSearch = (titular: TitularRowOutput, searchQuery: string): boolean => {
  const query = searchQuery.toLowerCase().trim();
  if (!query) return true;
  const matches = (person: { fullName: string; whatsapp: string }) =>
    person.fullName.toLowerCase().includes(query) || person.whatsapp.includes(query);
  return matches(titular) || (titular.companions?.some(matches) ?? false);
};

/** El grupo está completo solo si el titular y todos sus acompañantes llenaron el formulario. */
const groupRegistrationStatus = (titular: TitularRowOutput): "COMPLETED" | "PENDING" =>
  titular.formStatus === "COMPLETED" &&
  (titular.companions?.every((c) => c.formStatus === "COMPLETED") ?? true)
    ? "COMPLETED"
    : "PENDING";

const matchesSeat = (titular: TitularRowOutput, seatFilter: string): boolean => {
  const members = [titular, ...(titular.companions || [])];
  // Basta un integrante sin asiento para que el grupo requiera atención.
  if (seatFilter === "UNASSIGNED") return members.some((member) => !member.seatLabel);
  if (seatFilter === "ASSIGNED") return members.every((member) => !!member.seatLabel);
  return true;
};

/** Grupos que cumplen todos los filtros (búsqueda por titular o acompañante, pago, formulario, asiento). */
export function filterDashboardTravelers(
  travelers: TitularRowOutput[] | undefined,
  { searchQuery, paymentFilter, formFilter, seatFilter }: DashboardFilters,
): TitularRowOutput[] {
  if (!travelers) return [];
  return travelers.filter(
    (titular) =>
      matchesSearch(titular, searchQuery) &&
      (paymentFilter === "ALL" || resolveGroupPaymentStatus(titular) === paymentFilter) &&
      (formFilter === "ALL" || groupRegistrationStatus(titular) === formFilter) &&
      (seatFilter === "ALL" || matchesSeat(titular, seatFilter)),
  );
}

/**
 * Pasajeros que pueden recibir asiento: solo los grupos con anticipo cubierto
 * (`hasSeatRight`, regla 8; lo calcula la API). El titular lleva el tamaño del grupo.
 */
export function getSeatEligiblePassengers(
  travelers: TitularRowOutput[] | undefined,
): FlattenedPassenger[] {
  if (!travelers) return [];
  return travelers.flatMap((titular) => {
    if (!titular.hasSeatRight) return [];
    return [
      {
        id: titular.id,
        fullName: titular.fullName,
        bookingId: titular.bookingId,
        seatNumber: titular.seatLabel,
        role: titular.role,
        paxCount: titular.groupSize,
      },
      ...(titular.companions || []).map((companion) => ({
        id: companion.id,
        fullName: companion.fullName,
        bookingId: titular.bookingId,
        seatNumber: companion.seatLabel,
        role: companion.role,
        paxCount: 1,
      })),
    ];
  });
}

/** Titular o acompañante con ese id (para el drawer de detalle), o null. */
export function findDashboardTraveler(
  travelers: TitularRowOutput[] | undefined,
  travelerId: string | null,
): TitularRowOutput | CompanionOutput | null {
  if (!travelerId || !travelers) return null;
  for (const titular of travelers) {
    if (titular.id === travelerId) return titular;
    const companion = titular.companions?.find((c) => c.id === travelerId);
    if (companion) return companion;
  }
  return null;
}

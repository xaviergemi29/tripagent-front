import { useQuery } from "@tanstack/react-query"
import { MOCK_RESERVATIONS } from "../mocks/reservations.mock"
import type { ReservationOutput } from "../schemas/reservationSchema"

// ============================================================================
// 1. CONTRATOS (Tipos)
// ============================================================================
export type PaymentStatus = "PAID" | "PENDING" | "CASH_ON_ARRIVAL"

// export interface ReservationOutput {
//   id: string
//   tourId: string
//   customerName: string
//   phoneNumber: string
//   paymentStatus: PaymentStatus
//   seatsReserved: number
//   createdAt: string
// }

// ============================================================================
// 2. DATA FETCHER
// ============================================================================
const fetchReservationsByTourMock = async (tourId: string): Promise<ReservationOutput[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = MOCK_RESERVATIONS.filter(res => res.tourId === tourId)
      resolve(filtered as ReservationOutput[]) // Casteo temporal para el mock
    }, 700)
  })
}

// ============================================================================
// 3. CUSTOM HOOK
// ============================================================================
export function useReservationsByTour(tourId: string | undefined) {
  return useQuery({
    queryKey: ["reservations", "tour", tourId],
    queryFn: () => fetchReservationsByTourMock(tourId as string),
    enabled: !!tourId,
    staleTime: 1000 * 30, // 30 segundos
    retry: 2,
  })
}
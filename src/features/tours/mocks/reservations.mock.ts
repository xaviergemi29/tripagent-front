import { ReservationOutput } from "../schemas/reservation.schema";

export const MOCK_RESERVATIONS: ReservationOutput[] = [
  {
    id: "res-uuid-101",
    tourId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    customerName: "Carlos Slim",
    phoneNumber: "+52 55 1234 5678",
    paymentStatus: "PAID",
    seatsReserved: 2,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "res-uuid-102",
    tourId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    customerName: "Guillermo del Toro",
    phoneNumber: "+52 33 9876 5432",
    paymentStatus: "CASH_ON_ARRIVAL",
    seatsReserved: 4,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "res-uuid-103",
    tourId: "a39b34e5-91ab-4d8e-9012-1234abcd5678",
    customerName: "Salma Hayek",
    phoneNumber: "+52 22 4567 8901",
    paymentStatus: "PENDING",
    seatsReserved: 1,
    createdAt: new Date().toISOString(),
  },
];

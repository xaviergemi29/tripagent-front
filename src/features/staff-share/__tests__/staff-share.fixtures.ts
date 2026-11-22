import type { StaffShareOutput } from "../schemas/staff-share.schema";

/** Sprinter reducida: chofer, asiento de staff "1" y pasajeros "2"…"5". */
export const LAYOUT = [
  [{ type: "DRIVER" }, "AISLE", { type: "SEAT", label: "1", kind: "STAFF" }],
  [
    { type: "SEAT", label: "2", kind: "PASSENGER" },
    "AISLE",
    { type: "SEAT", label: "3", kind: "PASSENGER" },
  ],
  [
    { type: "SEAT", label: "4", kind: "PASSENGER" },
    "AISLE",
    { type: "SEAT", label: "10", kind: "PASSENGER" },
  ],
];

export const buildPayload = (overrides: Record<string, unknown> = {}) => ({
  tour: {
    title: "Zacatlán de las manzanas",
    departureDate: "2026-12-14",
    returnDate: "2026-12-15",
    temporalStatus: "PRÓXIMO",
  },
  agency: { name: "Viajes Xalapa", logoPath: null },
  expiresAt: "2026-12-16T05:59:00.000Z",
  vehicle: {
    name: "Sprinter 20",
    layoutMap: LAYOUT,
    capacity: { total: 4, passenger: 3, staff: 1 },
  },
  blockedSeats: ["4"],
  boardingPoints: [
    { code: "P1", location: "Terminal CAXA", time: "06:00" },
    { code: "P2", location: "Plaza Cristal", time: "06:30" },
  ],
  passengers: [
    {
      seatLabel: "10",
      fullName: "Luis Pérez Soto",
      passengerType: "CHILD",
      isTitular: false,
      boardingPointCode: "P2",
      seatRightStatus: "PENDING_DEPOSIT",
      // Campos que la API no debe mandar: el schema los descarta.
      whatsappPhone: "+522281234567",
      amountPaid: 4321,
    },
    {
      seatLabel: "2",
      fullName: "Ana Torres Ruiz",
      passengerType: "ADULT",
      isTitular: true,
      boardingPointCode: "P1",
      seatRightStatus: "CONFIRMED",
    },
    {
      seatLabel: null,
      fullName: "Marta Gómez",
      passengerType: "ADULT",
      isTitular: false,
      boardingPointCode: "P1",
      seatRightStatus: "PENDING_DEPOSIT",
    },
  ],
  ...overrides,
});

export const parsedPayload = (overrides: Record<string, unknown> = {}): StaffShareOutput =>
  buildPayload(overrides) as unknown as StaffShareOutput;

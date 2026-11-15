import { describe, expect, it } from "vitest";
import { PASSENGER_ROLE } from "@/shared/constants/domain.constants";
import type { TitularRowOutput } from "../../schemas/tour-dashboard.schema";
import {
  EMPTY_DASHBOARD_FILTERS,
  filterDashboardTravelers,
  findDashboardTraveler,
  getSeatEligiblePassengers,
  resolveGroupPaymentStatus,
} from "../dashboard-travelers.util";

// Filtros y listas del Centro de Control (escritorio y celular usan las mismas funciones).

let seq = 0;
const companion = (overrides: Partial<TitularRowOutput["companions"][number]> = {}) => ({
  id: `c-${++seq}`,
  bookingId: "b",
  role: PASSENGER_ROLE.COMPANION,
  fullName: "Acompañante",
  whatsapp: "",
  formStatus: "COMPLETED" as const,
  seatLabel: null,
  boardingPoint: null,
  boardingPointDetails: null,
  ...overrides,
});

// `paymentStatus` con los valores reales de la API (PARTIAL), no los del schema desfasado.
type GroupOverrides = Omit<Partial<TitularRowOutput>, "paymentStatus"> & { paymentStatus?: string };
const group = (overrides: GroupOverrides = {}): TitularRowOutput =>
  ({
    id: `t-${++seq}`,
    bookingId: `b-${seq}`,
    role: PASSENGER_ROLE.TITULAR,
    fullName: "Titular",
    whatsapp: "2280000000",
    groupSize: 1,
    hasSeatRight: true,
    formStatus: "COMPLETED",
    seatLabel: null,
    paymentStatus: "PENDING",
    paidAmount: 0,
    balance: 1000,
    companions: [],
    ...overrides,
  }) as TitularRowOutput;

const ANA = group({
  fullName: "Ana Torres",
  whatsapp: "2281234567",
  paymentStatus: "PAID",
  paidAmount: 3000,
  balance: 0,
  seatLabel: "1",
  companions: [companion({ fullName: "Luis Torres", whatsapp: "2289998888", seatLabel: "2" })],
});
const BETO = group({
  fullName: "Beto Ruiz",
  paymentStatus: "PARTIAL",
  paidAmount: 500,
  companions: [companion({ fullName: "Carla Ruiz", formStatus: "PENDING" })],
});
const DORA = group({ fullName: "Dora Sin Pago", hasSeatRight: false, formStatus: "PENDING" });
const ALL = [ANA, BETO, DORA];

const names = (list: TitularRowOutput[]) => list.map((t) => t.fullName);
const filter = (overrides: Partial<typeof EMPTY_DASHBOARD_FILTERS>) =>
  names(filterDashboardTravelers(ALL, { ...EMPTY_DASHBOARD_FILTERS, ...overrides }));

describe("resolveGroupPaymentStatus", () => {
  it.each([
    [{ paymentStatus: "PAID", paidAmount: 0, balance: 0 }, "PAID"],
    [{ paymentStatus: "PARTIAL", paidAmount: 900, balance: 0 }, "PAID"], // dato inconsistente
    [{ paymentStatus: "PARTIAL", paidAmount: 500, balance: 500 }, "PARTIAL"],
    [{ paymentStatus: "ADVANCE", paidAmount: 0, balance: 1000 }, "PARTIAL"], // estado antiguo
    [{ paymentStatus: "PENDING", paidAmount: 0, balance: 1000 }, "UNPAID"],
    [{ paymentStatus: "REFUNDED", paidAmount: 0, balance: 0 }, "UNPAID"],
  ])("%o → %s", (input, expected) => {
    expect(resolveGroupPaymentStatus(input)).toBe(expected);
  });
});

describe("filterDashboardTravelers", () => {
  it("sin filtros devuelve todos; sin datos, lista vacía", () => {
    expect(filter({})).toEqual(["Ana Torres", "Beto Ruiz", "Dora Sin Pago"]);
    expect(filterDashboardTravelers(undefined, EMPTY_DASHBOARD_FILTERS)).toEqual([]);
  });

  it("busca por nombre o WhatsApp del titular o de un acompañante", () => {
    expect(filter({ searchQuery: "  carla " })).toEqual(["Beto Ruiz"]);
    expect(filter({ searchQuery: "9998" })).toEqual(["Ana Torres"]);
    expect(filter({ searchQuery: "ANA" })).toEqual(["Ana Torres"]);
  });

  it("filtra por estado de pago del grupo", () => {
    expect(filter({ paymentFilter: "PAID" })).toEqual(["Ana Torres"]);
    expect(filter({ paymentFilter: "PARTIAL" })).toEqual(["Beto Ruiz"]);
    expect(filter({ paymentFilter: "UNPAID" })).toEqual(["Dora Sin Pago"]);
  });

  it("el formulario está completo solo si lo llenó todo el grupo", () => {
    expect(filter({ formFilter: "COMPLETED" })).toEqual(["Ana Torres"]);
    expect(filter({ formFilter: "PENDING" })).toEqual(["Beto Ruiz", "Dora Sin Pago"]);
  });

  it("asientos: asignado si todos tienen; sin asignar si falta alguno", () => {
    expect(filter({ seatFilter: "ASSIGNED" })).toEqual(["Ana Torres"]);
    expect(filter({ seatFilter: "UNASSIGNED" })).toEqual(["Beto Ruiz", "Dora Sin Pago"]);
  });

  it("combina los filtros (AND)", () => {
    expect(filter({ paymentFilter: "PARTIAL", formFilter: "COMPLETED" })).toEqual([]);
    expect(filter({ searchQuery: "ruiz", seatFilter: "UNASSIGNED" })).toEqual(["Beto Ruiz"]);
  });
});

describe("getSeatEligiblePassengers", () => {
  it("solo grupos con derecho a asiento; el titular lleva el tamaño del grupo", () => {
    const passengers = getSeatEligiblePassengers(ALL);
    expect(passengers.map((p) => p.fullName)).toEqual([
      "Ana Torres",
      "Luis Torres",
      "Beto Ruiz",
      "Carla Ruiz",
    ]);
    expect(passengers[0]).toMatchObject({
      seatNumber: "1",
      paxCount: ANA.groupSize,
      role: "TITULAR",
    });
    expect(passengers[1]).toMatchObject({ seatNumber: "2", paxCount: 1, bookingId: ANA.bookingId });
    expect(getSeatEligiblePassengers(undefined)).toEqual([]);
  });
});

describe("findDashboardTraveler", () => {
  it("encuentra titulares y acompañantes; null si no existe o no hay selección", () => {
    expect(findDashboardTraveler(ALL, ANA.id)).toBe(ANA);
    expect(findDashboardTraveler(ALL, BETO.companions[0]!.id)?.fullName).toBe("Carla Ruiz");
    expect(findDashboardTraveler(ALL, "no-existe")).toBeNull();
    expect(findDashboardTraveler(ALL, null)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { PASSENGER_ROLE } from "@/shared/constants/domain.constants";
import type { TitularRowOutput } from "../../schemas/tour-dashboard.schema";
import {
  applyLiveSeats,
  EMPTY_DASHBOARD_FILTERS,
  filterDashboardTravelers,
  findDashboardTraveler,
  getSeatEligiblePassengers,
  getGroupTotal,
  summarizeCompanionDrop,
  resolveGroupPaymentStatus,
  selectDashboardGroups,
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

  it("busca sin acentos y con el WhatsApp escrito con espacios", () => {
    expect(filter({ searchQuery: "ruíz" })).toEqual(["Beto Ruiz"]);
    expect(filter({ searchQuery: "228 999 8888" })).toEqual(["Ana Torres"]);
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

describe("applyLiveSeats", () => {
  const passengers = [
    { id: "a", seatNumber: null },
    { id: "b", seatNumber: "4" },
  ];

  it("toma el asiento de la caché del croquis (asignado al instante o recién liberado)", () => {
    const seats = [
      { seatLabel: "7", status: "ASSIGNED" as const, passenger: { id: "a", fullName: "Ana" } },
      { seatLabel: "9", status: "BLOCKED" as const, passenger: null },
    ];
    expect(applyLiveSeats(passengers, seats)).toEqual([
      { id: "a", seatNumber: "7" },
      // "b" ya no aparece en los asientos: se liberó y vuelve a "Faltan por acomodar".
      { id: "b", seatNumber: null },
    ]);
  });

  it("sin asientos cargados respeta el dato del dashboard", () => {
    expect(applyLiveSeats(passengers, undefined)).toBe(passengers);
  });
});

describe("selectDashboardGroups (filtro «Canceladas», 2026-11-17)", () => {
  const active = group({ fullName: "Ana Torres", paymentStatus: "PAID", paidAmount: 1000 });
  const cancelled = group({ fullName: "Carla Díaz", bookingStatus: "CANCELLED" });
  const otherCancelled = group({ fullName: "Beto Ruiz", bookingStatus: "CANCELLED" });
  const dashboard = { travelers: [active], cancelledTravelers: [cancelled, otherCancelled] };

  it("sin «Canceladas» muestra solo los grupos activos filtrados", () => {
    expect(selectDashboardGroups(dashboard, EMPTY_DASHBOARD_FILTERS)).toEqual([active]);
  });

  it("con «Canceladas» muestra las canceladas por el cliente y respeta la búsqueda", () => {
    const filters = { ...EMPTY_DASHBOARD_FILTERS, paymentFilter: "CANCELLED" };
    expect(selectDashboardGroups(dashboard, filters)).toEqual([cancelled, otherCancelled]);
    expect(selectDashboardGroups(dashboard, { ...filters, searchQuery: "carla" })).toEqual([
      cancelled,
    ]);
  });

  it("con «Canceladas» ignora los filtros de formulario y asiento (no aplican a una cancelada)", () => {
    const filters = {
      ...EMPTY_DASHBOARD_FILTERS,
      paymentFilter: "CANCELLED",
      formFilter: "PENDING",
      seatFilter: "ASSIGNED",
    };
    expect(selectDashboardGroups(dashboard, filters)).toHaveLength(2);
  });
});

describe("summarizeCompanionDrop (vista previa de la baja; espejo de la API)", () => {
  it.each([
    [
      "Escenario 1",
      3000,
      1000,
      250,
      1500,
      { newTotal: 2250, pendingBalance: 750, refundableSurplus: 0 },
    ],
    [
      "Escenario 2",
      6000,
      2000,
      2000,
      6000,
      { newTotal: 6000, pendingBalance: 0, refundableSurplus: 0 },
    ],
    [
      "Escenario 3",
      3000,
      1000,
      0,
      1000,
      { newTotal: 2000, pendingBalance: 1000, refundableSurplus: 0 },
    ],
    [
      "Escenario 4",
      3000,
      1000,
      250,
      3000,
      { newTotal: 2250, pendingBalance: 0, refundableSurplus: 750 },
    ],
  ])("%s", (_, currentTotal, unitPrice, penaltyAmount, amountPaid, expected) => {
    expect(
      summarizeCompanionDrop({ currentTotal, unitPrice, penaltyAmount, amountPaid }),
    ).toMatchObject(expected);
  });

  it("total del grupo = abonado + saldo − saldo a favor", () => {
    expect(getGroupTotal({ paidAmount: 1500, balance: 1500 })).toBe(3000);
    expect(getGroupTotal({ paidAmount: 3000, balance: 0, refundableSurplus: 750 })).toBe(2250);
  });
});

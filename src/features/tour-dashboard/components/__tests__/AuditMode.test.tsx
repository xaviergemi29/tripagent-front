import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SeatMapCanvas } from "@/features/tour-dashboard/components/seating/SeatMapCanvas";
import { VehicleStatusBanner } from "@/features/tour-dashboard/components/seating/VehicleStatusBanner";
import { BookingCard } from "../mobile/BookingCard";
import { temporalStatusSchema } from "../../schemas/tour-dashboard.schema";
import type { TitularRowOutput, VehicleOutput } from "../../schemas/tour-dashboard.schema";

// Decisiones del PM (2026-11-14): el Centro de Control usa los mismos cuatro estados que el
// catálogo, y un tour FINALIZADO o CANCELADO (pausado) queda en solo lectura, también en asientos.

const updateSeat = vi.fn();
vi.mock("@/features/tour-dashboard/hooks/useTourSeats", () => ({
  useTourSeats: () => ({
    data: [
      {
        seatLabel: "2",
        status: "ASSIGNED",
        passenger: { id: "p1", fullName: "Ana Torres" },
      },
      { seatLabel: "3", status: "BLOCKED", passenger: null },
    ],
  }),
  useUpdateSeat: () => ({ mutate: updateSeat }),
}));

const layoutMap = [["1", "AISLE", "2", "3"]];

describe("Estados del tour en el Centro de Control", () => {
  it("acepta los cuatro estados de la API y ya no 'ACTIVO'", () => {
    for (const status of ["PRÓXIMO", "EN CURSO", "FINALIZADO", "CANCELADO"]) {
      expect(temporalStatusSchema.safeParse(status).success).toBe(true);
    }
    expect(temporalStatusSchema.safeParse("ACTIVO").success).toBe(false);
  });
});

describe("Modo Auditoría: asientos de solo consulta", () => {
  it("el croquis muestra ocupados y bloqueados, pero sin botones ni menús", () => {
    render(
      <SeatMapCanvas
        tourId="t1"
        layoutMap={layoutMap as never}
        activePassengers={[]}
        staffCapacity={1}
        readOnly
      />,
    );

    expect(screen.getByLabelText("Asiento 2, Ana Torres")).toBeInTheDocument();
    expect(screen.getByLabelText("Asiento 3 bloqueado para staff")).toBeInTheDocument();
    expect(screen.getByLabelText("Asiento 1 libre")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText(/Solo consulta/)).toBeInTheDocument();
  });

  it("fuera de auditoría el croquis sigue siendo interactivo", () => {
    render(<SeatMapCanvas tourId="t1" layoutMap={layoutMap as never} activePassengers={[]} />);

    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("sin acción no se ofrece cambiar ni asignar vehículo", () => {
    const vehicle = {
      id: "v1",
      name: "Sprinter 20",
      capacity: { total: 20, passenger: 19, staff: 1 },
    } as unknown as VehicleOutput;
    const { rerender } = render(<VehicleStatusBanner vehicle={vehicle} />);
    expect(screen.queryByRole("button", { name: /Cambiar Vehículo/ })).not.toBeInTheDocument();

    rerender(<VehicleStatusBanner vehicle={null} />);
    expect(screen.queryByRole("button", { name: /Asignar Vehículo/ })).not.toBeInTheDocument();
  });

  it("la tarjeta móvil muestra 'Sin asiento' en lugar de '[ Asignar Asiento ]'", () => {
    const titular = {
      id: "trav-1",
      bookingId: "b1",
      fullName: "Ana Torres",
      whatsapp: "2281234567",
      groupSize: 1,
      hasSeatRight: true,
      seatLabel: null,
      boardingPoint: null,
      formStatus: "COMPLETED",
      paymentStatus: "PAID",
      paidAmount: 1000,
      balance: 0,
      bookedAt: "2026-11-10T15:00:00.000Z",
      companions: [],
    } as unknown as TitularRowOutput;

    render(<BookingCard titular={titular} requiresSeats onAssignSeatClick={vi.fn()} isAuditMode />);

    expect(screen.getByText("Sin asiento")).toBeInTheDocument();
    expect(screen.queryByText("[ Asignar Asiento ]")).not.toBeInTheDocument();
  });
});

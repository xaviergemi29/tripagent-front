import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TourForm } from "../TourForm";

// Regresión (2026-11-15): con el React Compiler, `watch("transportModality")` quedaba memorizado
// y al elegir "Hiking" la sección de abordaje no cambiaba. Ahora usa `useWatch`.

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("../../hooks/useTours", () => ({
  extractTourId: () => "t1",
  useCreateTour: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTour: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUploadTourBrochure: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/features/settings/hooks/useAgency", () => ({ useAgency: () => ({ data: undefined }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

describe("TourForm: modalidad de transporte", () => {
  it("al elegir 'Hiking' la sección pasa a punto de encuentro", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    expect(screen.getByText("2. Puntos de Abordaje")).toBeInTheDocument();

    await user.click(screen.getByText("Hiking / Punto de encuentro"));

    expect(await screen.findByText("2. Punto de Encuentro (Hiking)")).toBeInTheDocument();
    expect(screen.queryByText("2. Puntos de Abordaje")).not.toBeInTheDocument();
  });
});

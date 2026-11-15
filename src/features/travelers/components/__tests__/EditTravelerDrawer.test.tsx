import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditTravelerDrawer } from "../EditTravelerDrawer";

// Como en /travelers: el drawer empieza cerrado y se abre con un viajero. Debe cargar sus datos y
// enviar lo editado (no los valores con los que se abrió).

const update = vi.fn(async () => ({}));
vi.mock("../../hooks/useTravelers", () => ({
  useUpdateTraveler: () => ({ mutateAsync: update, isPending: false }),
}));

const traveler = {
  id: "v1",
  fullName: "Ana Torres",
  whatsappPhone: "2281234567",
  email: "ana@correo.mx",
  emergencyContactName: "Luis Torres",
  emergencyContactPhone: "2281112222",
  medicalNotes: "Asma",
  birthDate: "1990-05-29",
} as never;

describe("EditTravelerDrawer", () => {
  it("carga el viajero al abrir y guarda lo editado", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <EditTravelerDrawer traveler={null} isOpen={false} onClose={vi.fn()} />,
    );
    rerender(<EditTravelerDrawer traveler={traveler} isOpen onClose={vi.fn()} />);

    const name = await screen.findByDisplayValue("Ana Torres");
    await user.clear(name);
    await user.type(name, "Ana María Torres");
    const notes = screen.getByPlaceholderText(/penicilina/);
    await user.clear(notes);
    await user.type(notes, "Ninguna");
    await user.click(screen.getByRole("button", { name: /Guardar Cambios/ }));

    expect(update).toHaveBeenCalledWith({
      travelerId: "v1",
      travelerData: expect.objectContaining({
        fullName: "Ana María Torres",
        medicalNotes: "Ninguna",
      }),
    });
  });
});

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

  it("al cerrar y abrir otro viajero carga sus datos, no los editados del anterior", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <EditTravelerDrawer traveler={traveler} isOpen onClose={vi.fn()} />,
    );
    await user.type(await screen.findByDisplayValue("Ana Torres"), " (sin guardar)");

    const other = { ...(traveler as object), id: "v2", fullName: "Beto Ruiz" } as never;
    rerender(<EditTravelerDrawer traveler={traveler} isOpen={false} onClose={vi.fn()} />);
    rerender(<EditTravelerDrawer traveler={other} isOpen onClose={vi.fn()} />);

    expect(await screen.findByDisplayValue("Beto Ruiz")).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/sin guardar/)).not.toBeInTheDocument();
  });

  it("menor: cambia las etiquetas y oculta el correo", async () => {
    const user = userEvent.setup();
    render(<EditTravelerDrawer traveler={traveler} isOpen onClose={vi.fn()} />);
    await screen.findByDisplayValue("Ana Torres");

    await user.click(screen.getByRole("button", { name: /Niño/ }));

    expect(screen.getByText("Nombre Completo del Menor *")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("correo@ejemplo.com")).not.toBeInTheDocument();
  });
});

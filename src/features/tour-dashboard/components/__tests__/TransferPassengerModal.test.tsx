import { PASSENGER_ROLE } from "@/shared/constants/domain.constants";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransferPassengerModal } from "../TransferPassengerModal";

// Aísla el modal de la red: capturamos lo que se enviaría a PATCH /bookings/:bookingId/transfer.
const mutate = vi.fn();
vi.mock("../../hooks/useTourDashboard", () => ({
  useTransferPassenger: () => ({ mutate, isPending: false }),
}));

const BOOKING_ID = "f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1";
const TITULAR_ID = "f3f3f3f3-f3f3-4f3f-8f3f-f3f3f3f3f3f3";
const COMPANION_ID = "f4f4f4f4-f4f4-4f4f-8f4f-f4f4f4f4f4f4";

const BANNER = "El saldo abonado y el Magic Link pasarán a esta nueva persona.";
const INHERIT = "Heredar punto de abordaje del titular";

async function fillAdult(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre completo *"), "Persona Nueva");
  await user.type(screen.getByLabelText(/WhatsApp/), "2289999999");
  await user.type(screen.getByLabelText("Correo electrónico *"), "nueva@correo.mx");
}

describe("TransferPassengerModal", () => {
  beforeEach(() => mutate.mockClear());

  it("acompañante: sin banner, checkbox marcado y envía role COMPANION con su passengerId", async () => {
    const user = userEvent.setup();
    render(
      <TransferPassengerModal
        open
        onOpenChange={() => {}}
        bookingId={BOOKING_ID}
        passengerId={COMPANION_ID}
        role={PASSENGER_ROLE.COMPANION}
        currentName="Acompañante Original"
        currentWhatsapp={null}
      />,
    );

    expect(screen.queryByText(BANNER)).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: INHERIT })).toBeChecked();

    await fillAdult(user);
    const submit = screen.getByRole("button", { name: /Confirmar transferencia/ });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    const [{ bookingId, data }] = mutate.mock.calls[0]!;
    expect(bookingId).toBe(BOOKING_ID);
    expect(data).toMatchObject({
      passengerId: COMPANION_ID,
      role: PASSENGER_ROLE.COMPANION,
      fullName: "Persona Nueva",
      whatsapp: "2289999999",
      email: "nueva@correo.mx",
      isMinor: false,
      inheritTitularBoardingPoint: true,
    });
  });

  it("acompañante menor: oculta el correo y lo envía sin WhatsApp ni email", async () => {
    const user = userEvent.setup();
    render(
      <TransferPassengerModal
        open
        onOpenChange={() => {}}
        bookingId={BOOKING_ID}
        passengerId={COMPANION_ID}
        role={PASSENGER_ROLE.COMPANION}
        currentName="Acompañante Original"
        currentWhatsapp={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Menor" }));
    expect(screen.queryByLabelText("Correo electrónico *")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Nombre completo *"), "Niña Nueva");
    const submit = screen.getByRole("button", { name: /Confirmar transferencia/ });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    const { data } = mutate.mock.calls[0]![0];
    expect(data).toMatchObject({ role: PASSENGER_ROLE.COMPANION, isMinor: true });
    expect(data.whatsapp).toBeUndefined();
    expect(data.email).toBeUndefined();
  });

  it("titular: muestra el banner, no ofrece el checkbox y envía role TITULAR", async () => {
    const user = userEvent.setup();
    render(
      <TransferPassengerModal
        open
        onOpenChange={() => {}}
        bookingId={BOOKING_ID}
        passengerId={TITULAR_ID}
        role={PASSENGER_ROLE.TITULAR}
        currentName="Titular Original"
        currentWhatsapp="2281111111"
      />,
    );

    expect(screen.getByText(BANNER)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: INHERIT })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menor" })).toBeDisabled();

    await fillAdult(user);
    const submit = screen.getByRole("button", { name: /Confirmar transferencia/ });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    const { data } = mutate.mock.calls[0]![0];
    expect(data).toMatchObject({
      passengerId: TITULAR_ID,
      role: PASSENGER_ROLE.TITULAR,
      inheritTitularBoardingPoint: false,
    });
  });
});

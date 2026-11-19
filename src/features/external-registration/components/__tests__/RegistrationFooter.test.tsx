import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RegistrationFooter } from "../RegistrationFooter";

// Barra fija del registro del Magic Link (rediseño del 2026-11-19): el anticipo es la cifra
// principal y el total con el número de viajeros va como contexto. El botón conserva su handler y
// sus condiciones de deshabilitado.

const renderFooter = (props: Partial<Parameters<typeof RegistrationFooter>[0]> = {}) => {
  const onSubmit = vi.fn();
  render(
    <RegistrationFooter
      totalAmount={2000}
      depositAmount={500}
      currency="MXN"
      travelersCount={1}
      onSubmit={onSubmit}
      {...props}
    />,
  );
  return onSubmit;
};

describe("RegistrationFooter", () => {
  it("1 viajero: anticipo como cifra principal y «Total: … (1 viajero)»", () => {
    renderFooter();
    expect(screen.getByText("Anticipo hoy")).toBeInTheDocument();
    expect(screen.getByText("$500.00 MXN")).toBeInTheDocument();
    expect(screen.getByText(/Total: \$2,000\.00 MXN/)).toHaveTextContent(
      "Total: $2,000.00 MXN (1 viajero)",
    );
  });

  it("varios viajeros: plural en el contexto", () => {
    renderFooter({ totalAmount: 4000, depositAmount: 1000, travelersCount: 2 });
    expect(screen.getByText("$1,000.00 MXN")).toBeInTheDocument();
    expect(screen.getByText(/Total: \$4,000\.00 MXN/)).toHaveTextContent(
      "Total: $4,000.00 MXN (2 viajeros)",
    );
  });

  it("sin anticipo: la cifra principal es el total del viaje (no «Anticipo hoy $0.00»)", () => {
    renderFooter({ depositAmount: null, totalAmount: 3000, travelersCount: 3 });
    expect(screen.queryByText("Anticipo hoy")).not.toBeInTheDocument();
    expect(screen.getByText("Total del viaje")).toBeInTheDocument();
    expect(screen.getByText("$3,000.00 MXN")).toBeInTheDocument();
    expect(screen.getByText("(3 viajeros)")).toBeInTheDocument();
  });

  it("respeta la moneda del tour", () => {
    renderFooter({ currency: "USD" });
    expect(screen.getByText("$500.00 USD")).toBeInTheDocument();
  });

  it("el botón envía y se deshabilita con el formulario inválido o mientras se procesa", async () => {
    const onSubmit = renderFooter();
    await userEvent.click(screen.getByRole("button", { name: /Completar Registro/ }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("formulario inválido: botón deshabilitado", () => {
    renderFooter({ disabled: true });
    expect(screen.getByRole("button", { name: /Completar Registro/ })).toBeDisabled();
  });

  it("enviando: muestra «Procesando...» y no se puede volver a enviar", () => {
    renderFooter({ isSubmitting: true });
    const button = screen.getByRole("button", { name: /Procesando/ });
    expect(button).toBeDisabled();
  });
});

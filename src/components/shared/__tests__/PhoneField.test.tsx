import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, useWatch } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { PhoneField } from "../PhoneField";
import type { PhoneCountry } from "@/shared/utils/phone.util";

function Harness() {
  const { register, setValue, control } = useForm<{ phone: string; country: PhoneCountry }>({
    defaultValues: { phone: "", country: "MX" },
  });
  const country = useWatch({ control, name: "country" });
  return (
    <>
      <PhoneField
        registration={register("phone")}
        country={country}
        onCountryChange={(next) => setValue("country", next)}
        aria-label="Teléfono"
      />
      <output data-testid="country">{country}</output>
    </>
  );
}

describe("PhoneField", () => {
  it("muestra la bandera y la lada del país; busca por nombre o lada y selecciona", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /País del teléfono: México \(\+52\)/ }));
    const search = screen.getByRole("textbox", { name: "Buscar país o lada" });
    await user.type(search, "colom");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      expect.stringContaining("Colombia"),
    ]);
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("country").textContent).toBe("CO");
    expect(screen.getByRole("button", { name: /Colombia \(\+57\)/ })).toBeTruthy();
  });

  it("la búsqueda por lada +1 incluye a EE. UU. y Canadá", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /País del teléfono/ }));
    await user.type(screen.getByRole("textbox", { name: "Buscar país o lada" }), "+1");
    const names = screen.getAllByRole("option").map((o) => o.textContent ?? "");
    expect(names.some((n) => n.includes("Estados Unidos"))).toBe(true);
    expect(names.some((n) => n.includes("Canadá"))).toBe(true);
  });

  it("al pegar un número internacional cambia el país sin duplicar la lada", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Teléfono" }) as HTMLInputElement;
    await user.click(input);
    await user.paste("+1 604 555 1234");
    expect(input.value).toBe("6045551234");
    expect(screen.getByTestId("country").textContent).toBe("CA");
  });
});

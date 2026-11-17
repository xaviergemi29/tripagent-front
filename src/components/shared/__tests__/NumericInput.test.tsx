import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NumericInput } from "../NumericInput";

// Campo numérico controlado: lo escrito no se pega a un "0" que el propio campo reescribía, y un
// "0" escrito no desaparece (se puede capturar 0.50). Se revisa el texto visible (`.value`), no el
// número: "05" y "5" valen lo mismo y así el error pasaba inadvertido.

function Harness({ initial, onValue }: { initial: number; onValue?: (value: number) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <NumericInput
        aria-label="Monto"
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValue?.(next);
        }}
      />
      <button type="button" onClick={() => setValue(0)}>
        Limpiar
      </button>
      <button type="button" onClick={() => setValue(1500)}>
        Cargar
      </button>
    </>
  );
}

const input = () => screen.getByLabelText("Monto") as HTMLInputElement;

describe("NumericInput", () => {
  it("al borrar el monto y escribir otro, no queda un 0 a la izquierda", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness initial={3000} onValue={onValue} />);
    expect(input().value).toBe("3000");

    await user.clear(input());
    expect(input().value).toBe("");
    expect(onValue).toHaveBeenLastCalledWith(0);

    await user.type(input(), "500");
    expect(input().value).toBe("500");
    expect(onValue).toHaveBeenLastCalledWith(500);
  });

  it("un valor inicial de 0 se muestra vacío y lo escrito no se concatena", async () => {
    const user = userEvent.setup();
    render(<Harness initial={0} />);
    expect(input().value).toBe("");

    await user.type(input(), "2");
    expect(input().value).toBe("2");
  });

  it("permite escribir un 0 y decimales como 0.5", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness initial={0} onValue={onValue} />);

    await user.type(input(), "0.5");
    expect(input().value).toBe("0.5");
    expect(onValue).toHaveBeenLastCalledWith(0.5);
  });

  it("un cambio externo del valor (cargar, Limpiar) reemplaza el texto", async () => {
    const user = userEvent.setup();
    render(<Harness initial={0} />);
    await user.type(input(), "75");

    await user.click(screen.getByText("Cargar"));
    expect(input().value).toBe("1500");
    await user.click(screen.getByText("Limpiar"));
    expect(input().value).toBe("");
  });

  it("vaciar el campo no hace que React reescriba un 0", () => {
    render(<Harness initial={3000} />);
    fireEvent.change(input(), { target: { value: "" } });
    expect(input().value).toBe("");
  });
});

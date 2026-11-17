import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "../input";

// La rueda del mouse no cambia un campo numérico enfocado: pierde el foco (2026-11-17).

describe("Input numérico y la rueda del mouse", () => {
  it("al girar la rueda con el campo enfocado, pierde el foco y conserva el valor", () => {
    const onWheel = vi.fn();
    render(<Input type="number" aria-label="Monto" defaultValue="1500" onWheel={onWheel} />);
    const input = screen.getByLabelText("Monto");
    input.focus();
    expect(input).toHaveFocus();

    fireEvent.wheel(input, { deltaY: 100 });

    expect(input).not.toHaveFocus();
    expect(input).toHaveValue(1500);
    expect(onWheel).toHaveBeenCalledOnce(); // el onWheel propio se sigue llamando
  });

  it("un campo de texto no se ve afectado", () => {
    render(<Input aria-label="Nombre" />);
    const input = screen.getByLabelText("Nombre");
    input.focus();
    fireEvent.wheel(input, { deltaY: 100 });
    expect(input).toHaveFocus();
  });
});

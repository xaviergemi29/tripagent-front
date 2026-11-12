import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { LayoutMap } from "../../schemas/vehicle.schema";
import { getLayoutSeatLabels, parseVehicleLayout } from "../../utils/vehicle-layout.util";
import { PreviewSeat, VehicleLayoutGrid } from "../VehicleLayoutGrid";

// Cabina de la Sprinter (operador + staff) y una fila con pasillo, en formato tipado.
const sprinterLike: LayoutMap = [
  [{ type: "DRIVER" }, null, null, { type: "SEAT", label: "1", kind: "STAFF" }],
  [
    { type: "SEAT", label: "5", kind: "PASSENGER" },
    { type: "SEAT", label: "6", kind: "PASSENGER" },
    "AISLE",
    { type: "SEAT", label: "7", kind: "PASSENGER" },
  ],
];

// Última fila de autobús con WC de 2 columnas (como el Autobús 50).
const busTail: LayoutMap = [
  [
    { type: "SEAT", label: "49", kind: "PASSENGER" },
    { type: "SEAT", label: "50", kind: "PASSENGER" },
    "AISLE",
    { type: "WC", rowSpan: 1, colSpan: 2 },
    null,
  ],
];

describe("parseVehicleLayout", () => {
  it("separa asientos de pasajero y de staff; el operador no es asiento", () => {
    const layout = parseVehicleLayout(sprinterLike);
    expect(layout.seats.map((s) => `${s.label}:${s.kind}`)).toEqual([
      "1:STAFF",
      "5:PASSENGER",
      "6:PASSENGER",
      "7:PASSENGER",
    ]);
    expect(layout.items.filter((i) => i.type === "DRIVER")).toHaveLength(1);
  });

  it("detecta el pasillo como columna sin elementos; el WC ocupa sus columnas", () => {
    expect([...parseVehicleLayout(busTail).aisleColumns]).toEqual([3]);
    // En la Sprinter la columna 3 tiene el pasillo de la fila 2 pero nada más: es pasillo.
    expect([...parseVehicleLayout(sprinterLike).aisleColumns]).toEqual([3]);
  });

  it("acepta el formato anterior (texto = asiento de pasajero)", () => {
    expect(getLayoutSeatLabels([["01", "AISLE", "02", null]])).toEqual(["01", "02"]);
  });
});

describe("VehicleLayoutGrid", () => {
  it("dibuja operador, asientos y WC con su extensión", () => {
    const { container } = render(
      <VehicleLayoutGrid
        layoutMap={[...sprinterLike, ...busTail]}
        renderSeat={(seat) => <PreviewSeat seat={seat} />}
      />,
    );

    expect(screen.getByTitle(/Operador \(chofer\)/)).toBeInTheDocument();
    expect(screen.getByTitle("Asiento 1 · Staff")).toBeInTheDocument();
    expect(screen.getByTitle("Asiento 50")).toBeInTheDocument();

    const wc = screen.getByTitle("Sanitario");
    expect(wc).toHaveStyle({ gridColumn: "4 / span 2" });
    // 1 staff + 5 pasajeros; el operador y el WC no se dibujan como asiento.
    expect(container.querySelectorAll('[title^="Asiento"]')).toHaveLength(6);
  });
});

import { describe, expect, it } from "vitest";
import { staffShareOutputSchema } from "../schemas/staff-share.schema";
import { buildPayload } from "./staff-share.fixtures";

describe("staffShareOutputSchema", () => {
  it("descarta teléfonos y montos aunque la API los enviara", () => {
    const parsed = staffShareOutputSchema.parse(buildPayload());
    expect(JSON.stringify(parsed)).not.toMatch(/whatsapp|amountPaid|522281234567|4321/);
    expect(parsed.passengers).toHaveLength(3);
  });

  it("es tolerante: valores raros caen a un respaldo y no tumban la vista", () => {
    const parsed = staffShareOutputSchema.parse(
      buildPayload({
        passengers: [
          { fullName: 5, passengerType: "ROBOT", seatRightStatus: "???", boardingPointCode: 7 },
        ],
        boardingPoints: "mal",
        blockedSeats: null,
      }),
    );
    expect(parsed.passengers[0]).toMatchObject({
      seatLabel: null,
      fullName: "Pasajero",
      passengerType: "ADULT",
      seatRightStatus: "PENDING_DEPOSIT",
      boardingPointCode: null,
    });
    expect(parsed.boardingPoints).toEqual([]);
    expect(parsed.blockedSeats).toEqual([]);
  });

  it("un croquis ilegible se trata como sin vehículo", () => {
    const parsed = staffShareOutputSchema.parse(
      buildPayload({ vehicle: { name: "X", layoutMap: "roto" } }),
    );
    expect(parsed.vehicle).toBeNull();
  });
});

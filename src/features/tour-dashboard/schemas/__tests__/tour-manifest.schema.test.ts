import { describe, expect, it } from "vitest";
import { tourManifestOutputSchema } from "../tour-manifest.schema";

// Un dato de presentación raro en un pasajero o punto no debe tumbar todo el manifiesto (2026-11-16).

const passenger = (over: Record<string, unknown> = {}) => ({
  id: "t1",
  bookingId: "b1",
  fullName: "Ana Torres",
  isTitular: true,
  seatLabel: "7",
  boardingPoint: "Plaza Américas",
  emergencyContact: { name: "Luis", phone: "2281112222" },
  balance: 1500,
  groupSize: 2,
  ...over,
});

const manifest = (over: Record<string, unknown> = {}, pass = passenger()) => ({
  tourId: "tour-1",
  tourTitle: "Zacatlán",
  departureDateTime: "2026-11-20",
  currency: "MXN",
  boardingPoints: [{ id: "bp1", location: "Plaza Américas", time: "06:00", passengers: [pass] }],
  ...over,
});

describe("tourManifestOutputSchema", () => {
  it("acepta el manifiesto tal como lo envía la API", () => {
    expect(tourManifestOutputSchema.safeParse(manifest()).success).toBe(true);
  });

  it("tolera datos de presentación raros sin perder al pasajero", () => {
    const result = tourManifestOutputSchema.parse(
      manifest(
        {
          currency: "EUR",
          boardingPoints: [
            {
              location: null,
              time: undefined,
              passengers: [
                passenger({
                  emergencyContact: { name: "Luis", phone: null },
                  boardingPoint: 12,
                  groupSize: 0,
                }),
              ],
            },
          ],
        },
        undefined,
      ),
    );
    const point = result.boardingPoints[0];
    expect(point).toMatchObject({
      id: "sin-id",
      location: "Sin punto especificado",
      time: "--:--",
    });
    expect(point.passengers[0]).toMatchObject({
      fullName: "Ana Torres",
      emergencyContact: null,
      boardingPoint: "Por asignar",
      groupSize: 1,
      balance: 1500,
    });
    expect(result.currency).toBe("MXN");
  });

  it("el saldo sí se exige: uno inválido no se muestra como $0", () => {
    expect(
      tourManifestOutputSchema.safeParse(manifest({}, passenger({ balance: "abc" }))).success,
    ).toBe(false);
    // La API puede mandar numéricos como texto.
    const ok = tourManifestOutputSchema.parse(manifest({}, passenger({ balance: "250.50" })));
    expect(ok.boardingPoints[0].passengers[0].balance).toBe(250.5);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildBedDeletionTarget,
  buildRoomDeletionTarget,
  buildRoomingListText,
  removeBedFromRoom,
  removeRoomFromLodging,
  getRoomDescription,
  getRoomDisplayName,
  buildStayLabel,
  countLodgingPendingPassengers,
  filterRooms,
  findFreeMatrimonialBed,
  getFreeBeds,
  getRoomTitles,
  getUnassignedPassengers,
  groupUnassignedPassengers,
} from "../lodging.util";
import { makeHotel, makeLodging, makeRoom, PASSENGERS, ROOMS } from "./lodging.fixtures";

describe("hospedaje: pendientes de la insignia", () => {
  it("sin hoteles usa los pasajeros activos del dashboard", () => {
    expect(countLodgingPendingPassengers(undefined, 7)).toBe(7);
    expect(countLodgingPendingPassengers({ hotels: [], passengers: PASSENGERS }, 7)).toBe(7);
  });

  it("con hoteles cuenta a quien no tiene cama en al menos uno", () => {
    const withBed = makeLodging([
      makeRoom("r1", { slots: [{ slotIndex: 1, bookingPassengerId: "p1" }] }),
    ]);
    expect(countLodgingPendingPassengers(withBed, 99)).toBe(2);

    const twoHotels = {
      passengers: PASSENGERS,
      hotels: [
        makeHotel([
          makeRoom("a", {
            capacity: 4,
            slots: [1, 2, 3].map((i) => ({ slotIndex: i, bookingPassengerId: `p${i}` })),
          }),
        ]),
        makeHotel([makeRoom("b", { slots: [{ slotIndex: 1, bookingPassengerId: "p1" }] })], {
          id: "h2",
        }),
      ],
    };
    // p2 y p3 no tienen cama en el segundo hotel.
    expect(countLodgingPendingPassengers(twoHotels, 0)).toBe(2);
  });
});

describe("hospedaje: títulos y camas", () => {
  it("numera por posición entre las habitaciones con las mismas camas", () => {
    const titles = getRoomTitles([
      makeRoom("x", { singleBeds: 2, position: 3 }),
      makeRoom("y", { matrimonialBeds: 1, position: 1 }),
      makeRoom("z", { singleBeds: 2, position: 2 }),
      makeRoom("w", { matrimonialBeds: 1, singleBeds: 1, position: 4 }),
    ]);
    expect(titles).toEqual({
      y: "Matrimonial #1",
      z: "Doble · 2 individuales #1",
      x: "Doble · 2 individuales #2",
      w: "Triple · 1 matrimonial + 1 individual #1",
    });
  });

  it("ignora el roomType heredado: 2 individuales nunca se muestran como matrimonial", () => {
    const room = makeRoom("a", { roomType: "MATRIMONIAL", singleBeds: 2 });
    expect(getRoomTitles([room])).toEqual({ a: "Doble · 2 individuales #1" });
    expect(getRoomDescription(room)).toBe("2 camas individuales · 2 personas");
  });

  it("lista las camas libres con su etiqueta por disposición", () => {
    const rooms = [
      makeRoom("r2", {
        matrimonialBeds: 1,
        singleBeds: 1,
        slots: [{ slotIndex: 1, bookingPassengerId: "p1" }],
      }),
    ];
    expect(getFreeBeds(rooms)).toEqual([
      {
        roomId: "r2",
        slotIndex: 2,
        label: "Triple · 1 matrimonial + 1 individual #1 · Cama matrimonial 1 · lado B",
      },
      {
        roomId: "r2",
        slotIndex: 3,
        label: "Triple · 1 matrimonial + 1 individual #1 · Cama individual 1",
      },
    ]);
  });

  it("busca una cama matrimonial con sus 2 lugares libres en cualquier habitación", () => {
    expect(findFreeMatrimonialBed(ROOMS)).toEqual({ roomId: "r1", slotIndexes: [1, 2] });
    const occupied = [makeRoom("r1", { slots: [{ slotIndex: 1, bookingPassengerId: "p1" }] })];
    expect(findFreeMatrimonialBed(occupied)).toBeUndefined();
    expect(findFreeMatrimonialBed([makeRoom("s", { singleBeds: 2 })])).toBeUndefined();
    // La segunda cama matrimonial de una habitación con la primera ocupada.
    const twoBeds = [
      makeRoom("d", {
        matrimonialBeds: 2,
        singleBeds: 1,
        slots: [{ slotIndex: 2, bookingPassengerId: "p1" }],
      }),
    ];
    expect(findFreeMatrimonialBed(twoBeds)).toEqual({ roomId: "d", slotIndexes: [3, 4] });
  });

  it("filtra habitaciones por camas", () => {
    const occupied = [makeRoom("r1", { slots: [{ slotIndex: 1, bookingPassengerId: "p1" }] })];
    expect(filterRooms(ROOMS, "ALL")).toHaveLength(3);
    expect(filterRooms(ROOMS, "WITH_MATRIMONIAL")).toHaveLength(1);
    expect(filterRooms(ROOMS, "ONLY_SINGLES")).toHaveLength(2);
    expect(filterRooms(occupied, "FREE_BEDS")).toHaveLength(1);
  });
});

describe("hospedaje: pasajeros sin cama", () => {
  it("excluye a quien ya tiene cama en el hotel", () => {
    const hotel = makeHotel([
      makeRoom("r1", { slots: [{ slotIndex: 1, bookingPassengerId: "p3" }] }),
    ]);
    expect(getUnassignedPassengers(hotel, PASSENGERS).map((p) => p.bookingPassengerId)).toEqual([
      "p1",
      "p2",
    ]);
  });

  it("agrupa por reserva solo con 2 o más sin cama", () => {
    const { groups, individuals } = groupUnassignedPassengers(PASSENGERS);
    expect(groups).toHaveLength(1);
    expect(groups[0].groupLabel).toBe("Familia Pérez");
    expect(individuals.map((p) => p.fullName)).toEqual(["Marta Ruiz"]);

    // Si uno del grupo ya tiene cama, el otro pasa a individual.
    const afterOne = groupUnassignedPassengers(
      PASSENGERS.filter((p) => p.bookingPassengerId !== "p2"),
    );
    expect(afterOne.groups).toHaveLength(0);
    expect(afterOne.individuals).toHaveLength(2);
  });
});

describe("hospedaje: fechas y texto del rooming list", () => {
  it("arma la estancia con las fechas del tour y las noches", () => {
    expect(buildStayLabel("2026-11-14T06:00:00.000Z", "2026-11-16")).toMatch(/\(2 noches\)$/);
    expect(buildStayLabel("2026-11-14T06:00:00.000Z", "2026-11-15")).toMatch(/\(1 noche\)$/);
    expect(buildStayLabel("2026-11-14T06:00:00.000Z", null)).not.toMatch(/noche/);
  });

  it("genera el texto con número de cuarto o título, estado y pasajeros", () => {
    const hotel = makeHotel([
      makeRoom("r1", {
        position: 1,
        slots: [
          { slotIndex: 1, bookingPassengerId: "p1" },
          { slotIndex: 2, bookingPassengerId: "p2" },
        ],
      }),
      makeRoom("r2", { singleBeds: 2, position: 2, roomNumber: "102" }),
    ]);
    const text = buildRoomingListText({
      tourTitle: "Huasteca Potosina",
      hotel,
      stayLabel: "14 nov – 16 nov (2 noches)",
      passengers: PASSENGERS,
    });
    expect(text.split("\n")).toEqual([
      "ROOMING LIST - HUASTECA POTOSINA",
      "Hotel: Hotel Sierra (14 nov – 16 nov (2 noches))",
      "----------------------------------------",
      "• Matrimonial #1 (1 cama matrimonial · 2 personas):",
      "  - Ana Pérez, Luis Pérez",
      "• Hab. 102 (2 camas individuales · 2 personas):",
      "  - Sin asignar",
    ]);
  });
});

describe("hospedaje: eliminar camas y habitaciones", () => {
  it("nombre con número de cuarto", () => {
    expect(getRoomDisplayName("Doble · 2 individuales #1", "102")).toBe(
      "Doble · 2 individuales #1 · Hab. 102",
    );
    expect(getRoomDisplayName("Doble · 2 individuales #1", null)).toBe("Doble · 2 individuales #1");
  });

  it("eliminar una cama individual baja un lugar y recorre las siguientes", () => {
    const room = makeRoom("r1", {
      singleBeds: 3,
      slots: [
        { slotIndex: 1, bookingPassengerId: "p1" },
        { slotIndex: 2, bookingPassengerId: "p2" },
        { slotIndex: 3, bookingPassengerId: "p3" },
      ],
    });
    const next = removeBedFromRoom(room, 2);
    expect(next.capacity).toBe(2);
    expect(next.singleBeds).toBe(2);
    expect(next.slots).toEqual([
      { slotIndex: 1, bookingPassengerId: "p1" },
      { slotIndex: 2, bookingPassengerId: "p3" },
    ]);
    expect(getRoomTitles([next])).toEqual({ r1: "Doble · 2 individuales #1" });
  });

  it("eliminar un lugar de una matrimonial quita la cama completa (2 lugares)", () => {
    const room = makeRoom("r1", {
      matrimonialBeds: 1,
      singleBeds: 1,
      slots: [
        { slotIndex: 1, bookingPassengerId: "p1" },
        { slotIndex: 2, bookingPassengerId: "p2" },
        { slotIndex: 3, bookingPassengerId: "p3" },
      ],
    });
    const next = removeBedFromRoom(room, 2);
    expect(next.capacity).toBe(1);
    expect(next.matrimonialBeds).toBe(0);
    expect(next.singleBeds).toBe(1);
    expect(next.slots).toEqual([{ slotIndex: 1, bookingPassengerId: "p3" }]);
    expect(getRoomTitles([next])).toEqual({ r1: "Individual #1" });
  });

  it("objetivos de eliminación: matrimonial con 2 ocupantes, individual libre y habitación", () => {
    const room = makeRoom("r1", {
      matrimonialBeds: 1,
      singleBeds: 1,
      roomNumber: "102",
      slots: [
        { slotIndex: 1, bookingPassengerId: "p1" },
        { slotIndex: 2, bookingPassengerId: "p2" },
      ],
    });
    expect(buildBedDeletionTarget(room, "Triple #1", 2, PASSENGERS)).toEqual({
      roomId: "r1",
      roomName: "Triple #1 · Hab. 102",
      slotIndex: 2,
      bedName: "cama matrimonial 1",
      slotsCount: 2,
      assignedPassengers: [
        { id: "p1", fullName: "Ana Pérez" },
        { id: "p2", fullName: "Luis Pérez" },
      ],
    });
    const single = buildBedDeletionTarget(room, "Triple #1", 3, PASSENGERS);
    expect(single).toMatchObject({
      bedName: "cama individual 1",
      slotsCount: 1,
      assignedPassengers: [],
    });
    expect(buildRoomDeletionTarget(room, "Triple #1")).toEqual({
      roomId: "r1",
      roomName: "Triple #1 · Hab. 102",
      totalBeds: 3,
      assignedPassengersCount: 2,
    });
  });

  it("removeRoomFromLodging conserva el hotel aunque quede sin habitaciones", () => {
    const next = removeRoomFromLodging(makeLodging([makeRoom("r1")]), "r1");
    expect(next.hotels).toHaveLength(1);
    expect(next.hotels[0].rooms).toEqual([]);
    expect(next.totalRooms).toBe(0);
    expect(next.totalCapacity).toBe(0);
  });
});

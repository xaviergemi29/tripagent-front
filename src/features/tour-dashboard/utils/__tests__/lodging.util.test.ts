import { describe, expect, it } from "vitest";
import {
  buildBedDeletionTarget,
  buildRoomDeletionTarget,
  buildRoomingListText,
  removeBedFromRoom,
  resolveRoomTypeForCapacity,
  removeRoomFromLodging,
  getRoomDescription,
  getRoomDisplayName,
  buildStayLabel,
  countLodgingPendingPassengers,
  filterRooms,
  findEmptyMatrimonial,
  getBedLabel,
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
  it("numera por posición entre las habitaciones del mismo tipo", () => {
    const titles = getRoomTitles([
      makeRoom("x", { roomType: "DOUBLE_INDIVIDUAL", position: 3 }),
      makeRoom("y", { roomType: "MATRIMONIAL", position: 1 }),
      makeRoom("z", { roomType: "DOUBLE_INDIVIDUAL", position: 2 }),
    ]);
    expect(titles).toEqual({
      y: "Matrimonial #1",
      z: "Doble Individual #1",
      x: "Doble Individual #2",
    });
  });

  it("etiqueta las camas según el tipo", () => {
    expect(getBedLabel("DOUBLE_INDIVIDUAL", 1)).toBe("Cama A");
    expect(getBedLabel("DOUBLE_INDIVIDUAL", 2)).toBe("Cama B");
    expect(getBedLabel("MATRIMONIAL", 2)).toBe("Lugar 2");
    expect(getBedLabel("TRIPLE", 3)).toBe("Lugar 3");
    expect(getBedLabel("QUADRUPLE", 4)).toBe("Lugar 4");
  });

  it("lista las camas libres con su etiqueta", () => {
    const rooms = [
      makeRoom("r2", {
        roomType: "DOUBLE_INDIVIDUAL",
        slots: [{ slotIndex: 1, bookingPassengerId: "p1" }],
      }),
    ];
    expect(getFreeBeds(rooms)).toEqual([
      { roomId: "r2", slotIndex: 2, label: "Doble Individual #1 · Cama B" },
    ]);
  });

  it("encuentra la matrimonial vacía y filtra habitaciones", () => {
    expect(findEmptyMatrimonial(ROOMS)?.id).toBe("r1");
    const occupied = [makeRoom("r1", { slots: [{ slotIndex: 1, bookingPassengerId: "p1" }] })];
    expect(findEmptyMatrimonial(occupied)).toBeUndefined();
    expect(filterRooms(ROOMS, "ALL")).toHaveLength(3);
    expect(filterRooms(ROOMS, "MATRIMONIAL")).toHaveLength(1);
    expect(filterRooms(ROOMS, "DOUBLE_INDIVIDUAL")).toHaveLength(2);
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
      makeRoom("r2", {
        roomType: "DOUBLE_INDIVIDUAL",
        position: 2,
        roomNumber: "102",
        status: "CONFIRMED",
      }),
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
      "• Matrimonial #1 (1 cama matrimonial · 2 pers.) [Consultada]:",
      "  - Ana Pérez, Luis Pérez",
      "• Hab. 102 (2 camas individuales · 2 pers.) [Confirmada]:",
      "  - Sin asignar",
    ]);
  });
});

describe("hospedaje: eliminar camas y habitaciones", () => {
  it("la descripción es la del tipo; con datos que no coinciden añade los lugares", () => {
    expect(getRoomDescription(makeRoom("a", { roomType: "DOUBLE_INDIVIDUAL" }))).toBe(
      "2 camas individuales · 2 pers.",
    );
    expect(getRoomDescription(makeRoom("a", { roomType: "SINGLE", capacity: 1 }))).toBe(
      "1 cama individual · 1 pers.",
    );
    expect(getRoomDescription(makeRoom("a", { roomType: "TRIPLE", capacity: 2 }))).toBe(
      "1 matrimonial + 1 individual · 3 pers. (2 lugares)",
    );
  });

  it("nombre con número de cuarto y etiquetas por tipo y posición", () => {
    expect(getRoomDisplayName("Doble Individual #1", "102")).toBe("Doble Individual #1 · Hab. 102");
    expect(getRoomDisplayName("Doble Individual #1", null)).toBe("Doble Individual #1");
    expect(getBedLabel("DOUBLE_INDIVIDUAL", 1)).toBe("Cama A");
  });

  it("la pareja va a una Matrimonial vacía; una Individual no sirve", () => {
    expect(
      findEmptyMatrimonial([makeRoom("s", { roomType: "SINGLE", capacity: 1 })]),
    ).toBeUndefined();
    expect(
      findEmptyMatrimonial([
        makeRoom("s", { roomType: "SINGLE", capacity: 1, position: 1 }),
        makeRoom("m", { position: 2 }),
      ])?.id,
    ).toBe("m");
  });

  it("resolveRoomTypeForCapacity: conserva el tipo si coincide y si no usa el de la capacidad", () => {
    expect(resolveRoomTypeForCapacity("MATRIMONIAL", 2)).toBe("MATRIMONIAL");
    expect(resolveRoomTypeForCapacity("DOUBLE_INDIVIDUAL", 2)).toBe("DOUBLE_INDIVIDUAL");
    expect(resolveRoomTypeForCapacity("MATRIMONIAL", 1)).toBe("SINGLE");
    expect(resolveRoomTypeForCapacity("DOUBLE_INDIVIDUAL", 1)).toBe("SINGLE");
    expect(resolveRoomTypeForCapacity("TRIPLE", 3)).toBe("TRIPLE");
    expect(resolveRoomTypeForCapacity("TRIPLE", 2)).toBe("DOUBLE_INDIVIDUAL");
    expect(resolveRoomTypeForCapacity("QUADRUPLE", 3)).toBe("TRIPLE");
    expect(resolveRoomTypeForCapacity("QUADRUPLE", 4)).toBe("QUADRUPLE");
    expect(resolveRoomTypeForCapacity("SINGLE", 1)).toBe("SINGLE");
  });

  it("eliminar una cama cambia el tipo y el título pasa a 'Individual #1'", () => {
    const room = makeRoom("r1", { roomType: "DOUBLE_INDIVIDUAL", capacity: 2 });
    const next = removeBedFromRoom(room, 2);
    expect(next.roomType).toBe("SINGLE");
    expect(next.capacity).toBe(1);
    expect(getRoomTitles([next])).toEqual({ r1: "Individual #1" });
    expect(getRoomDescription(next)).toBe("1 cama individual · 1 pers.");
    expect(getBedLabel("SINGLE", 1)).toBe("Cama A");
    expect(removeBedFromRoom(makeRoom("m", { capacity: 2 }), 1).roomType).toBe("SINGLE");
  });

  it("objetivos de eliminación: cama ocupada, libre y habitación", () => {
    const room = makeRoom("r1", {
      roomType: "DOUBLE_INDIVIDUAL",
      roomNumber: "102",
      slots: [{ slotIndex: 2, bookingPassengerId: "p1" }],
    });
    expect(buildBedDeletionTarget(room, "Doble Individual #1", 2, PASSENGERS)).toEqual({
      roomId: "r1",
      roomName: "Doble Individual #1 · Hab. 102",
      slotIndex: 2,
      bedLabel: "Cama B",
      assignedPassenger: { id: "p1", fullName: "Ana Pérez" },
    });
    expect(
      buildBedDeletionTarget(room, "Doble Individual #1", 1, PASSENGERS).assignedPassenger,
    ).toBeNull();
    expect(buildRoomDeletionTarget(room, "Doble Individual #1")).toEqual({
      roomId: "r1",
      roomName: "Doble Individual #1 · Hab. 102",
      totalBeds: 2,
      assignedPassengersCount: 1,
    });
  });

  it("removeBedFromRoom libera la cama y recorre las siguientes", () => {
    const room = makeRoom("r1", {
      capacity: 4,
      slots: [
        { slotIndex: 1, bookingPassengerId: "p1" },
        { slotIndex: 2, bookingPassengerId: "p2" },
        { slotIndex: 4, bookingPassengerId: "p3" },
      ],
    });
    const next = removeBedFromRoom(room, 2);
    expect(next.capacity).toBe(3);
    expect(next.roomType).toBe("TRIPLE");
    expect(next.slots).toEqual([
      { slotIndex: 1, bookingPassengerId: "p1" },
      { slotIndex: 3, bookingPassengerId: "p3" },
    ]);
  });

  it("removeRoomFromLodging conserva el hotel aunque quede sin habitaciones", () => {
    const next = removeRoomFromLodging(makeLodging([makeRoom("r1")]), "r1");
    expect(next.hotels).toHaveLength(1);
    expect(next.hotels[0].rooms).toEqual([]);
    expect(next.totalRooms).toBe(0);
    expect(next.totalCapacity).toBe(0);
  });
});

import { isSlotReservationConflict } from "./calendar.service";

describe("Calendar slot conflict translation", () => {
  it.each([
    [{ code: "P2002" }],
    [{ code: "23P01" }],
    [{ meta: { code: "23P01" } }],
    [new Error('violates exclusion constraint "SlotReservation_no_overlap_excl"')],
    [new Error("PostgreSQL error 23P01")],
  ])("recognizes provider and Prisma representations of an overlap", (error) => {
    expect(isSlotReservationConflict(error)).toBe(true);
  });

  it("does not hide unrelated database failures", () => {
    expect(isSlotReservationConflict(new Error("connection lost"))).toBe(false);
  });
});

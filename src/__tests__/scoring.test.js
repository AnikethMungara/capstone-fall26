import { describe, it, expect } from "vitest";
import { isCorrect, isGraded, scoreAttempt } from "../scoring.js";

const single = { id: "s", type: "single", answer: 2 };
const multi = { id: "m", type: "multi", answer: [0, 2, 3] };
const scale = { id: "c", type: "scale" };

describe("isCorrect", () => {
  it("single: exact index only", () => {
    expect(isCorrect(single, 2)).toBe(true);
    expect(isCorrect(single, 1)).toBe(false);
    expect(isCorrect(single, 0)).toBe(false); // 0 must not be treated as "unanswered"
    expect(isCorrect(single, undefined)).toBe(false);
  });
  it("multi: all-and-only, order independent", () => {
    expect(isCorrect(multi, [3, 0, 2])).toBe(true);
    expect(isCorrect(multi, [0, 2])).toBe(false); // missing one
    expect(isCorrect(multi, [0, 1, 2, 3])).toBe(false); // extra one
    expect(isCorrect(multi, [])).toBe(false);
    expect(isCorrect(multi, undefined)).toBe(false);
  });
});

describe("isGraded", () => {
  it("excludes scale, tagtext and ratingtext", () => {
    expect(isGraded(single)).toBe(true);
    expect(isGraded(multi)).toBe(true);
    for (const type of ["scale", "tagtext", "ratingtext"]) expect(isGraded({ type })).toBe(false);
  });
});

describe("scoreAttempt", () => {
  const qs = [single, multi, scale];
  it("scores graded items and averages scale items", () => {
    const r = scoreAttempt(qs, { s: 2, m: [0, 2], c: 4 });
    expect(r.correct).toBe(1);
    expect(r.total).toBe(2);
    expect(r.scaleAvg).toBe(4);
    expect(r.items[1].correct).toBe(false);
    expect(r.items[2].correct).toBeNull();
  });
  it("perfect score", () => {
    expect(scoreAttempt(qs, { s: 2, m: [2, 3, 0], c: 5 }).correct).toBe(2);
  });
  it("unanswered questions count as wrong and scaleAvg is null", () => {
    const r = scoreAttempt(qs, {});
    expect(r.correct).toBe(0);
    expect(r.total).toBe(2);
    expect(r.scaleAvg).toBeNull();
  });
  it("averages several scale answers", () => {
    const r = scoreAttempt([{ id: "a", type: "scale" }, { id: "b", type: "scale" }], { a: 2, b: 5 });
    expect(r.scaleAvg).toBe(3.5);
    expect(r.total).toBe(0);
  });
});

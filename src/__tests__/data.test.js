// Data integrity: the question banks are the source of truth for every survey.
import { describe, it, expect } from "vitest";
import { modules, phases, getQuestions } from "../data/modules.js";
import { getSurveyItems, journeyStages, surveyLabels } from "../data/surveys.js";
import { feedbackPrompts, getFeedbackQuestions, MAX_TEXT, RATING_MIN, RATING_MAX } from "../data/feedback.js";

const FORMS = ["A", "B", "C"];

describe("module question banks", () => {
  it("has 4 modules, each with 5 concepts (4 graded + 1 scale)", () => {
    expect(modules).toHaveLength(4);
    for (const m of modules) {
      expect(m.concepts).toHaveLength(5);
      expect(m.concepts.filter((c) => c.type !== "scale")).toHaveLength(4);
    }
  });

  it("every concept has all three parallel forms A, B and C", () => {
    for (const m of modules) for (const c of m.concepts) expect(Object.keys(c.forms).sort()).toEqual(FORMS);
  });

  it("question ids are unique across every module and form", () => {
    const ids = modules.flatMap((m) => FORMS.flatMap((f) => getQuestions(m, f).map((q) => q.id)));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(60);
  });

  it("every graded question has an in-range answer and an explanation", () => {
    for (const m of modules) for (const f of FORMS) for (const q of getQuestions(m, f)) {
      if (q.type === "scale") continue;
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      expect(q.text.length, q.id).toBeGreaterThan(10);
      expect(q.explanation, q.id).toBeTruthy();
      const answers = q.type === "multi" ? q.answer : [q.answer];
      for (const a of answers) {
        expect(Number.isInteger(a), q.id).toBe(true);
        expect(a, q.id).toBeGreaterThanOrEqual(0);
        expect(a, q.id).toBeLessThan(q.options.length);
      }
      if (q.type === "multi") {
        expect(new Set(q.answer).size, q.id).toBe(q.answer.length);
        expect(q.answer.length, q.id).toBeGreaterThan(1);
      }
    }
  });

  it("options within a question are distinct", () => {
    for (const m of modules) for (const f of FORMS) for (const q of getQuestions(m, f)) {
      if (q.type === "scale") continue;
      expect(new Set(q.options).size, q.id).toBe(q.options.length);
    }
  });

  it("the three forms of every concept have different stems (and different options)", () => {
    for (const m of modules) for (const c of m.concepts) {
      expect(new Set(FORMS.map((f) => c.forms[f].text)).size, `${m.id}.${c.id} stems`).toBe(3);
      const sig = FORMS.map((f) => JSON.stringify(c.forms[f].options ?? c.forms[f].scaleLabels));
      // m4.real is a more/same/less question: the options ARE the answer scale, so only its scenario changes.
      const fixedScale = `${m.id}.${c.id}` === "m4.real";
      if (c.type !== "scale" && !fixedScale) expect(new Set(sig).size, `${m.id}.${c.id} options`).toBe(3);
    }
  });

  it("each form keeps concept type consistent (single vs multi vs scale)", () => {
    for (const m of modules) for (const f of FORMS) {
      const qs = getQuestions(m, f);
      qs.forEach((q, i) => expect(q.type).toBe(m.concepts[i].type));
    }
  });

  it("scale questions carry two labels", () => {
    for (const m of modules) for (const f of FORMS) for (const q of getQuestions(m, f)) {
      if (q.type === "scale") expect(q.scaleLabels).toHaveLength(2);
    }
  });

  it("phases map to forms A, B, C and a feedback phase", () => {
    expect(phases.pre.form).toBe("A");
    expect(phases.post.form).toBe("B");
    expect(phases.followup.form).toBe("C");
    expect(phases.feedback.kind).toBe("feedback");
  });
});

describe("before/after confidence surveys", () => {
  it("each module has 4 items with stable ids shared by before and after", () => {
    for (const m of modules) {
      const items = getSurveyItems(m);
      expect(items).toHaveLength(4);
      expect(new Set(items.map((i) => i.id)).size).toBe(4);
      expect(items.every((i) => i.type === "scale" && i.id.startsWith(`${m.id}.`))).toBe(true);
      expect(items.at(-1).conceptId).toBe("overall");
    }
  });

  it("has labels for every stage of the journey", () => {
    expect(journeyStages).toEqual(["before", "quiz", "after", "feedback"]);
    for (const s of journeyStages) expect(surveyLabels[s]).toBeTruthy();
  });
});

describe("feedback survey", () => {
  it("has 6 prompts: 5 tag+text and 1 rating+text", () => {
    expect(feedbackPrompts).toHaveLength(6);
    expect(feedbackPrompts.filter((p) => p.type === "tagtext")).toHaveLength(5);
    expect(feedbackPrompts.filter((p) => p.type === "ratingtext")).toHaveLength(1);
  });

  it("rating range is 1 to 5 and text cap is 500", () => {
    expect([RATING_MIN, RATING_MAX]).toEqual([1, 5]);
    expect(MAX_TEXT).toBe(500);
  });

  it("each tag prompt has distinct tags, one question, and no double-barrel wording", () => {
    for (const p of feedbackPrompts) {
      expect(p.text.endsWith("?") || p.text.endsWith("."), p.id).toBe(true);
      expect((p.text.match(/\?/g) ?? []).length, p.id).toBeLessThanOrEqual(1);
      if (p.type === "tagtext") {
        expect(p.tags.length).toBeGreaterThanOrEqual(4);
        expect(new Set(p.tags).size).toBe(p.tags.length);
      }
    }
  });

  it("namespaces ids per module", () => {
    const a = getFeedbackQuestions(modules[0]).map((q) => q.id);
    const b = getFeedbackQuestions(modules[1]).map((q) => q.id);
    expect(a.every((id) => id.startsWith("m1.feedback."))).toBe(true);
    expect(a.filter((id) => b.includes(id))).toHaveLength(0);
  });
});

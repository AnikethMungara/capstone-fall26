import { describe, it, expect, vi } from "vitest";
import { saveAnswer, getRecords, getAnswersFor, toCSV, submitRecords, clearRecords } from "../records.js";
import { getRespondentId, peekRespondentId, clearRespondent } from "../respondent.js";

const base = { respondentId: "r1", surveyType: "before", moduleId: "m1", questionId: "m1.budget", conceptId: "budget", answer: 3 };

describe("respondent id (#96)", () => {
  it("is null until first use, then created once and reused", () => {
    expect(peekRespondentId()).toBeNull();
    const a = getRespondentId();
    expect(a).toBeTruthy();
    expect(getRespondentId()).toBe(a);
    expect(peekRespondentId()).toBe(a);
  });
  it("is a unique id per respondent after clearing", () => {
    const ids = new Set();
    for (let i = 0; i < 50; i++) {
      ids.add(getRespondentId());
      clearRespondent();
    }
    expect(ids.size).toBe(50);
    expect(peekRespondentId()).toBeNull();
  });
});

describe("records (#80)", () => {
  it("stores every required field", () => {
    const rec = saveAnswer(base);
    expect(Object.keys(rec).sort()).toEqual(
      ["answer", "conceptId", "moduleId", "questionId", "respondentId", "surveyType", "timestamp"],
    );
    expect(new Date(rec.timestamp).toString()).not.toBe("Invalid Date");
    expect(getRecords()).toHaveLength(1);
  });

  it("upserts: re-answering or refreshing never creates duplicates", () => {
    saveAnswer(base);
    saveAnswer({ ...base, answer: 5 });
    saveAnswer({ ...base, answer: 5 });
    const all = getRecords();
    expect(all).toHaveLength(1);
    expect(all[0].answer).toBe(5);
  });

  it("keeps the same question in different survey types / modules / respondents as separate records", () => {
    saveAnswer(base);
    saveAnswer({ ...base, surveyType: "after" });
    saveAnswer({ ...base, respondentId: "r2" });
    saveAnswer({ ...base, moduleId: "m2" });
    expect(getRecords()).toHaveLength(4);
  });

  it("30 of 30 answers saved with all fields and no duplicates (5 per survey type x 6)", () => {
    const types = ["before", "quiz", "after", "feedback", "pre", "post"];
    for (const t of types) for (let q = 0; q < 5; q++) {
      saveAnswer({ ...base, surveyType: t, questionId: `m1.q${q}`, conceptId: `q${q}`, answer: q });
      saveAnswer({ ...base, surveyType: t, questionId: `m1.q${q}`, conceptId: `q${q}`, answer: q }); // resubmit
    }
    const all = getRecords();
    expect(all).toHaveLength(30);
    for (const r of all) for (const f of ["respondentId", "surveyType", "moduleId", "questionId", "timestamp"]) {
      expect(r[f], f).toBeTruthy();
    }
  });

  it("getAnswersFor returns only that respondent/survey/module, keyed by question", () => {
    saveAnswer(base);
    saveAnswer({ ...base, questionId: "m1.balance", answer: 4 });
    saveAnswer({ ...base, surveyType: "after", answer: 1 });
    saveAnswer({ ...base, respondentId: "other", answer: 2 });
    expect(getAnswersFor("r1", "before", "m1")).toEqual({ "m1.budget": 3, "m1.balance": 4 });
    expect(getAnswersFor("nobody", "before", "m1")).toEqual({});
  });

  it("preserves free text and tags verbatim (quotes, commas, newlines, emoji)", () => {
    const text = 'He said "wow", then\nleft 😀 — café';
    saveAnswer({ ...base, surveyType: "feedback", answer: { tags: ["Pacing"], text } });
    expect(getRecords()[0].answer.text).toBe(text);
    expect(getRecords()[0].answer.tags).toEqual(["Pacing"]);
  });

  it("survives corrupted storage", () => {
    localStorage.setItem("mm_records", "{not json");
    expect(getRecords()).toEqual([]);
    saveAnswer(base);
    expect(getRecords()).toHaveLength(1);
  });

  it("clearRecords empties the store", () => {
    saveAnswer(base);
    clearRecords();
    expect(getRecords()).toEqual([]);
  });
});

describe("CSV export", () => {
  it("has a header, one line per record, and escapes quotes", () => {
    saveAnswer(base);
    saveAnswer({ ...base, questionId: "m1.q", answer: 'say "hi", ok' });
    const lines = toCSV(getRecords()).split("\n");
    expect(lines[0]).toBe("respondentId,surveyType,moduleId,questionId,conceptId,answer,timestamp");
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain('"say ""hi"", ok"');
  });
  it("an empty export is just the header", () => {
    expect(toCSV([])).toBe("respondentId,surveyType,moduleId,questionId,conceptId,answer,timestamp");
  });
});

describe("submitRecords", () => {
  it("stays local when no endpoint is configured", async () => {
    expect(await submitRecords([base])).toEqual({ ok: true, local: true });
  });
  it("POSTs JSON when VITE_SUBMIT_URL is set", async () => {
    vi.stubEnv("VITE_SUBMIT_URL", "https://example.test/submit");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const res = await submitRecords([base]);
    expect(res).toEqual({ ok: true, local: false });
    expect(fetchMock).toHaveBeenCalledWith("https://example.test/submit", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toHaveLength(1);
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});

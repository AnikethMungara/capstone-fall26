// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { toCsv, parseCsv, safeCell } from "../csv.js";
import { flatten, validate, COLUMNS } from "../flatten.js";
import { createStore } from "../store.js";
import { createApp } from "../index.js";
import { submitRecords } from "../../src/records.js";

const rec = (over = {}) => ({
  respondentId: "r1", surveyType: "before", moduleId: "m1", questionId: "m1.budget",
  conceptId: "budget", answer: 3, timestamp: "2026-11-18T10:00:00.000Z", ...over,
});

let dir, file;
beforeEach(async () => { dir = await fs.mkdtemp(path.join(os.tmpdir(), "mm-")); file = path.join(dir, "data", "responses.csv"); });
afterEach(async () => { await fs.rm(dir, { recursive: true, force: true }); });

describe("csv", () => {
  it("round-trips commas, quotes, newlines, CRLF and unicode", () => {
    const tricky = ['a,b', 'say "hi"', "line1\nline2", "win\r\nline", "café 😀 — ü", "", "  spaces  "];
    const cols = ["x"];
    const parsed = parseCsv(toCsv(cols, tricky.map((x) => ({ x }))));
    expect(parsed[0]).toEqual(["x"]);
    expect(parsed.slice(1).map((r) => r[0])).toEqual(tricky.map(String));
  });
  it("strips a UTF-8 BOM when parsing", () => {
    expect(parseCsv("﻿a,b\n1,2\n")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("neutralises spreadsheet formulas but leaves numbers alone", () => {
    for (const bad of ["=1+1", "+cmd", "-cmd", "@SUM(A1)", "\t=x"]) expect(safeCell(bad), bad).toBe(`'${bad}`);
    for (const ok of ["4", "-1", "3.5", "hello", "a=b", ""]) expect(safeCell(ok), ok).toBe(ok);
  });
});

describe("flatten / validate", () => {
  it("scale/single -> answer; multi -> 'a;b'; feedback -> tags/text; rating -> rating", () => {
    expect(flatten(rec()).answer).toBe("3");
    expect(flatten(rec({ answer: 0 })).answer).toBe("0"); // 0 is a real answer
    expect(flatten(rec({ answer: [0, 2, 3] })).answer).toBe("0;2;3");
    const fb = flatten(rec({ answer: { tags: ["Pacing", "Wording"], text: "hi" } }));
    expect([fb.answer, fb.tags, fb.text, fb.rating]).toEqual(["", "Pacing;Wording", "hi", ""]);
    const rt = flatten(rec({ answer: { rating: 4, text: "ok" } }));
    expect([rt.rating, rt.text, rt.tags]).toEqual(["4", "ok", ""]);
  });
  it("always produces every column as a string", () => {
    const row = flatten(rec());
    expect(Object.keys(row)).toEqual(COLUMNS);
    expect(Object.values(row).every((v) => typeof v === "string")).toBe(true);
  });
  it("rejects bad records with a reason", () => {
    expect(validate(rec())).toBeNull();
    expect(validate(null)).toMatch(/object/);
    expect(validate([])).toMatch(/object/);
    expect(validate(rec({ respondentId: "" }))).toMatch(/respondentId/);
    expect(validate(rec({ surveyType: undefined }))).toMatch(/surveyType/);
    expect(validate(rec({ questionId: "x".repeat(201) }))).toMatch(/too long/);
    expect(validate(rec({ answer: undefined }))).toMatch(/answer/);
    expect(validate(rec({ answer: null }))).toMatch(/answer/);
  });
});

describe("store", () => {
  it("creates the file and directory on first write with a header", async () => {
    const s = await createStore(file);
    await s.upsert([rec()]);
    const text = await fs.readFile(file, "utf8");
    expect(text.split("\n")[0]).toBe(COLUMNS.join(","));
    expect(parseCsv(text)).toHaveLength(2);
  });
  it("upserts: resubmitting or changing an answer never duplicates", async () => {
    const s = await createStore(file);
    await s.upsert([rec(), rec({ answer: 5 }), rec({ answer: 5 })]);
    expect(s.size()).toBe(1);
    expect(s.all()[0].answer).toBe("5");
  });
  it("distinguishes respondent / survey type / module / question", async () => {
    const s = await createStore(file);
    await s.upsert([rec(), rec({ respondentId: "r2" }), rec({ surveyType: "after" }), rec({ moduleId: "m2" }), rec({ questionId: "q" })]);
    expect(s.size()).toBe(5);
  });
  it("persists across restarts and keeps upserting into the same rows", async () => {
    await (await createStore(file)).upsert([rec(), rec({ questionId: "q2" })]);
    const again = await createStore(file);
    expect(again.size()).toBe(2);
    await again.upsert([rec({ answer: 1 })]);
    expect(again.size()).toBe(2);
    expect(parseCsv(await fs.readFile(file, "utf8"))).toHaveLength(3);
  });
  it("preserves hostile free text exactly across restart", async () => {
    const text = 'He said "wow", ok\nnew line, 😀';
    await (await createStore(file)).upsert([rec({ surveyType: "feedback", answer: { tags: ["A"], text } })]);
    expect((await createStore(file)).all()[0].text).toBe(text);
  });
  it("reports rejected records but saves the valid ones", async () => {
    const s = await createStore(file);
    const r = await s.upsert([rec(), { nope: 1 }, rec({ questionId: "q2" })]);
    expect(r).toMatchObject({ saved: 2, total: 2 });
    expect(r.rejected).toEqual([{ index: 1, error: "respondentId is required" }]);
  });
  it("writes nothing when every record is invalid", async () => {
    const s = await createStore(file);
    await s.upsert([{}]);
    await expect(fs.access(file)).rejects.toThrow();
  });
  it("50 concurrent writers lose no rows and leave valid CSV", async () => {
    const s = await createStore(file);
    await Promise.all(Array.from({ length: 50 }, (_, i) => s.upsert([rec({ respondentId: `r${i}` })])));
    expect(s.size()).toBe(50);
    expect(parseCsv(await fs.readFile(file, "utf8")).filter((r) => r.length > 1)).toHaveLength(51);
  });
  it("leaves no temp files behind", async () => {
    const s = await createStore(file);
    await s.upsert([rec()]);
    expect(await fs.readdir(path.dirname(file))).toEqual(["responses.csv"]);
  });
});

describe("HTTP routes", () => {
  let app, base;
  const start = async (opts = {}) => {
    app = await createApp({ file, ...opts });
    await new Promise((r) => app.server.listen(0, r));
    base = `http://127.0.0.1:${app.server.address().port}`;
  };
  afterEach(() => new Promise((r) => (app ? app.server.close(r) : r())));
  const post = (body, raw = false) =>
    fetch(`${base}/api/responses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: raw ? body : JSON.stringify(body) });

  it("GET /api/health", async () => {
    await start();
    expect(await (await fetch(`${base}/api/health`)).json()).toEqual({ ok: true, rows: 0 });
  });

  it("POST one record or an array, then GET JSON and CSV", async () => {
    await start();
    expect((await post(rec())).status).toBe(200);
    const r = await post([rec({ questionId: "q2" }), rec({ questionId: "q3", answer: [1, 2] })]);
    expect(await r.json()).toMatchObject({ saved: 2, total: 3 });

    const json = await (await fetch(`${base}/api/responses`)).json();
    expect(json).toHaveLength(3);

    const csvRes = await fetch(`${base}/api/responses.csv`);
    expect(csvRes.headers.get("content-type")).toContain("text/csv");
    expect(csvRes.headers.get("content-disposition")).toContain("mentamorph-responses.csv");
    const rows = parseCsv(await csvRes.text());
    expect(rows[0]).toEqual(COLUMNS);
    expect(rows).toHaveLength(4);
  });

  it("the CSV on disk matches what the API serves (data is really saved to a file)", async () => {
    await start();
    await post([rec(), rec({ questionId: "q2" })]);
    const disk = parseCsv(await fs.readFile(file, "utf8"));
    const api = parseCsv(await (await fetch(`${base}/api/responses.csv`)).text());
    expect(disk).toEqual(api);
  });

  it("resubmitting the same answers is idempotent (no duplicate rows)", async () => {
    await start();
    for (let i = 0; i < 5; i++) await post([rec(), rec({ questionId: "q2" })]);
    expect((await (await fetch(`${base}/api/health`)).json()).rows).toBe(2);
  });

  it("400 for invalid JSON, empty array, and all-invalid records", async () => {
    await start();
    expect((await post("{oops", true)).status).toBe(400);
    expect((await post([])).status).toBe(400);
    const bad = await post([{ respondentId: "x" }]);
    expect(bad.status).toBe(400);
    expect((await bad.json()).rejected).toHaveLength(1);
  });

  it("413 for a body over 1 MB", async () => {
    await start();
    const res = await post(rec({ answer: { text: "x".repeat(1024 * 1024 + 10) } }));
    expect(res.status).toBe(413);
  });

  it("404 for unknown routes and wrong methods", async () => {
    await start();
    expect((await fetch(`${base}/nope`)).status).toBe(404);
    expect((await fetch(`${base}/api/health`, { method: "POST" })).status).toBe(404);
    expect((await fetch(`${base}/api/responses`, { method: "DELETE" })).status).toBe(404);
  });

  it("CORS: preflight succeeds and responses carry the configured origin", async () => {
    await start({ corsOrigin: "https://app.example" });
    const pre = await fetch(`${base}/api/responses`, { method: "OPTIONS" });
    expect(pre.status).toBe(204);
    expect(pre.headers.get("access-control-allow-origin")).toBe("https://app.example");
    expect(pre.headers.get("access-control-allow-headers")).toContain("Content-Type");
    expect((await fetch(`${base}/api/health`)).headers.get("access-control-allow-origin")).toBe("https://app.example");
  });

  it("API_KEY protects reads but not submissions", async () => {
    await start({ apiKey: "s3cret" });
    expect((await post(rec())).status).toBe(200); // students can submit without a key
    for (const p of ["/api/responses", "/api/responses.csv"]) {
      expect((await fetch(base + p)).status, p).toBe(401);
      expect((await fetch(base + p, { headers: { "x-api-key": "wrong" } })).status, p).toBe(401);
      expect((await fetch(base + p, { headers: { "x-api-key": "s3cret" } })).status, p).toBe(200);
    }
  });

  it("formula-looking free text is neutralised in the downloaded CSV", async () => {
    await start();
    await post(rec({ surveyType: "feedback", answer: { tags: [], text: "=HYPERLINK(\"http://evil\")" } }));
    expect(await (await fetch(`${base}/api/responses.csv`)).text()).toContain(`'=HYPERLINK`);
  });

  it("frontend submitRecords() -> backend -> CSV end to end", async () => {
    await start();
    vi.stubEnv("VITE_SUBMIT_URL", `${base}/api/responses`);
    const res = await submitRecords([rec(), rec({ questionId: "q2", answer: [0, 2] })]);
    expect(res).toEqual({ ok: true, local: false });
    expect(parseCsv(await fs.readFile(file, "utf8"))).toHaveLength(3);
    vi.unstubAllEnvs();
  });
});

describe("frontend resilience", () => {
  it("submitRecords never throws when the backend is down", async () => {
    vi.stubEnv("VITE_SUBMIT_URL", "http://127.0.0.1:1/api/responses"); // nothing listens on port 1
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await submitRecords([rec()]);
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
    vi.unstubAllEnvs();
  });
  it("reports ok:false on a non-2xx response", async () => {
    vi.stubEnv("VITE_SUBMIT_URL", "http://x.test/api");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect((await submitRecords([rec()])).ok).toBe(false);
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});

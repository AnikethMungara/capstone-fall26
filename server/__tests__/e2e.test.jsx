// Drives the real <App /> through the whole student flow with VITE_SUBMIT_URL
// pointing at a live backend, then inspects the CSV file the server wrote.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import App from "../../src/App.jsx";
import { createApp } from "../index.js";
import { parseCsv } from "../csv.js";
import { peekRespondentId } from "../../src/respondent.js";
import { getSurveyItems } from "../../src/data/surveys.js";
import { getFeedbackQuestions } from "../../src/data/feedback.js";
import { modules, getQuestions } from "../../src/data/modules.js";

let dir, file, app, base;
beforeEach(async () => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "mm-e2e-"));
  file = path.join(dir, "responses.csv");
  app = await createApp({ file });
  await new Promise((r) => app.server.listen(0, r));
  base = `http://127.0.0.1:${app.server.address().port}`;
  vi.stubEnv("VITE_SUBMIT_URL", `${base}/api/responses`);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await new Promise((r) => app.server.close(r));
  await fs.rm(dir, { recursive: true, force: true });
});

async function answerAndAdvance(u, value = "4") {
  const c = document.body;
  const dots = c.querySelectorAll(".dot"), options = c.querySelectorAll(".option"), chips = c.querySelectorAll(".tag-chip");
  if (dots.length) await u.click(within(c).getByRole("button", { name: value }));
  else if (options.length) await u.click(options[0]);
  if (chips.length) await u.click(chips[0]);
  const box = c.querySelector("textarea");
  if (box) await u.type(box, "Great, but \"fast\"");
  await u.click(screen.getByRole("button", { name: /^(Next|Submit)$/ }));
  // A real network round trip is in flight on Submit; wait for "Sending…" to clear.
  await waitFor(() => expect(screen.queryByRole("button", { name: "Sending…" })).toBeNull());
}
const until = async (u, pred) => { for (let i = 0; i < 60 && !pred(); i++) await answerAndAdvance(u); expect(pred()).toBe(true); };
const rowsOf = async () => {
  const [header, ...body] = parseCsv(await fs.readFile(file, "utf8"));
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
};

describe("app -> backend -> CSV", () => {
  it("a full student run lands in the CSV: every survey, one respondent id, no duplicates", async () => {
    const u = userEvent.setup();
    render(<App />);
    await u.click(screen.getAllByRole("button", { name: /Start full flow/ })[0]);
    const id = peekRespondentId();
    await until(u, () => !!screen.queryByText(/your results/));
    await u.click(screen.getByRole("button", { name: /Continue to feedback/ }));
    await until(u, () => !!screen.queryByText(/Thanks for the feedback/));

    const rows = await rowsOf();
    const m = modules[0];
    const expected = {
      before: getSurveyItems(m).length,
      quiz: getQuestions(m, "A").filter((q) => q.type !== "scale").length,
      after: getSurveyItems(m).length,
      feedback: getFeedbackQuestions(m).length,
    };
    const counts = {};
    for (const r of rows) counts[r.surveyType] = (counts[r.surveyType] ?? 0) + 1;
    expect(counts).toEqual(expected);
    expect(rows.every((r) => r.respondentId === id)).toBe(true);
    expect(new Set(rows.map((r) => `${r.surveyType}|${r.questionId}`)).size).toBe(rows.length);

    // flattened columns are populated the right way
    const before = rows.filter((r) => r.surveyType === "before");
    expect(before.every((r) => r.answer === "4")).toBe(true);
    const tagged = rows.find((r) => r.surveyType === "feedback" && r.tags);
    expect(tagged.text).toBe('Great, but "fast"');
    expect(rows.find((r) => r.surveyType === "feedback" && r.rating).rating).toBe("4");
    expect(rows.every((r) => !Number.isNaN(Date.parse(r.receivedAt)))).toBe(true);
  }, 60000);

  it("two students submitting in turn produce separate, complete row sets", async () => {
    for (let s = 0; s < 2; s++) {
      localStorage.clear();
      const u = userEvent.setup();
      const { unmount } = render(<App />);
      await u.click(screen.getAllByRole("button", { name: /Start full flow/ })[0]);
      await until(u, () => !!screen.queryByText(/your results/));
      unmount();
    }
    const rows = await rowsOf();
    const ids = new Set(rows.map((r) => r.respondentId));
    expect(ids.size).toBe(2);
    for (const id of ids) expect(rows.filter((r) => r.respondentId === id && r.surveyType === "after")).toHaveLength(4);
  }, 60000);

  it("if the backend is down the student still finishes, and answers sync on the next submit", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("VITE_SUBMIT_URL", "http://127.0.0.1:1/api/responses"); // dead
    const u = userEvent.setup();
    render(<App />);
    await u.click(screen.getAllByRole("button", { name: /Start full flow/ })[0]);
    await until(u, () => !!screen.queryByText(/your results/)); // not blocked by the outage
    expect(await rowsOf().catch(() => [])).toHaveLength(0);

    vi.stubEnv("VITE_SUBMIT_URL", `${base}/api/responses`); // server comes back
    await u.click(screen.getByRole("button", { name: /Continue to feedback/ }));
    await until(u, () => !!screen.queryByText(/Thanks for the feedback/));
    const rows = await rowsOf();
    // earlier before/quiz/after answers were re-sent along with the feedback submit
    expect(new Set(rows.map((r) => r.surveyType))).toEqual(new Set(["before", "quiz", "after", "feedback"]));
  }, 60000);
});

// End-to-end: drives the real <App /> through the student path.
// Covers #83 (before -> quiz -> after -> feedback, 10 runs), #97 (after-quiz
// submits answers incl. skip / go back / refresh) and #96 (one respondent id).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App.jsx";
import { getRecords } from "../records.js";
import { peekRespondentId } from "../respondent.js";
import { modules, getQuestions } from "../data/modules.js";
import { getSurveyItems } from "../data/surveys.js";
import { getFeedbackQuestions } from "../data/feedback.js";

beforeEach(() => vi.spyOn(console, "info").mockImplementation(() => {}));

const user = () => userEvent.setup();
const headingNow = () => screen.queryByRole("heading", { level: 2 })?.textContent ?? screen.queryByRole("heading", { level: 1 })?.textContent;

// Answer whatever question is on screen, then press Next/Submit. Returns true if it advanced.
async function answerAndAdvance(u, { value = "4", skip = false } = {}) {
  const c = document.body;
  if (!skip) {
    const dots = c.querySelectorAll(".dot");
    const options = c.querySelectorAll(".option");
    const chips = c.querySelectorAll(".tag-chip");
    if (dots.length) await u.click(within(c).getByRole("button", { name: value }));
    else if (options.length) await u.click(options[0]);
    if (chips.length) await u.click(chips[0]);
    const box = c.querySelector("textarea");
    if (box) await u.type(box, "It was fine, “quoted” text");
  }
  const btn = screen.getByRole("button", { name: /^(Next|Submit)$/ });
  await u.click(btn);
}

async function runUntil(u, predicate, opts, max = 60) {
  for (let i = 0; i < max && !predicate(); i++) await answerAndAdvance(u, opts);
  expect(predicate()).toBe(true);
}

const startFlow = async (u, n = 0) =>
  u.click(screen.getAllByRole("button", { name: /Start full flow/ })[n]);

const onResults = () => !!screen.queryByText(/your results/);
const onThanks = () => !!screen.queryByText(/Thanks for the feedback/);
const stage = () => document.querySelector(".row .muted")?.textContent ?? "";

describe("full student path (#83)", () => {
  it("shows screens in order: before -> quiz -> after -> results -> feedback", async () => {
    const u = user();
    render(<App />);
    await startFlow(u);

    const seen = [];
    for (let i = 0; i < 40 && !onResults(); i++) {
      const s = stage().split("·")[1]?.trim();
      if (s && seen.at(-1) !== s) seen.push(s);
      await answerAndAdvance(u);
    }
    expect(seen).toEqual(["Before-quiz survey", "Quiz", "After-quiz survey"]);
    expect(onResults()).toBe(true);

    await u.click(screen.getByRole("button", { name: /Continue to feedback/ }));
    expect(stage()).toContain("Feedback");
    await runUntil(u, onThanks);
  });

  it("asks the right number of questions in each stage with none skipped or repeated", async () => {
    const u = user();
    const m = modules[0];
    const expected = [
      ["Before-quiz survey", getSurveyItems(m).map((q) => q.text)],
      ["Quiz", getQuestions(m, "A").filter((q) => q.type !== "scale").map((q) => q.text)],
      ["After-quiz survey", getSurveyItems(m).map((q) => q.text)],
    ];
    render(<App />);
    await startFlow(u);
    for (const [label, texts] of expected) {
      for (const text of texts) {
        expect(stage()).toContain(label);
        expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(text);
        await answerAndAdvance(u);
      }
    }
    expect(onResults()).toBe(true);
  });

  it("10 of 10 full runs complete in order, 5 narrow-viewport and 5 desktop", async () => {
    for (let run = 0; run < 10; run++) {
      localStorage.clear();
      window.innerWidth = run < 5 ? 1280 : 390; // layout itself is CSS; the logic must not depend on width
      const u = user();
      const { unmount } = render(<App />);
      await startFlow(u, run % 4);
      await runUntil(u, onResults);
      await u.click(screen.getByRole("button", { name: /Continue to feedback/ }));
      await runUntil(u, onThanks);
      unmount();
    }
  }, 60000);
});

describe("one respondent id across all surveys (#96)", () => {
  it("is created when the before survey starts and shared by before, quiz, after and feedback", async () => {
    const u = user();
    render(<App />);
    expect(peekRespondentId()).toBeNull();
    await startFlow(u);
    const id = peekRespondentId();
    expect(id).toBeTruthy();
    await runUntil(u, onResults);
    await u.click(screen.getByRole("button", { name: /Continue to feedback/ }));
    await runUntil(u, onThanks, { skip: false });

    const recs = getRecords();
    expect(new Set(recs.map((r) => r.respondentId))).toEqual(new Set([id]));
    expect(new Set(recs.map((r) => r.surveyType))).toEqual(new Set(["before", "quiz", "after", "feedback"]));
  });

  it("is cleared after feedback so the next student gets a new id", async () => {
    const u = user();
    render(<App />);
    await startFlow(u);
    const first = peekRespondentId();
    await runUntil(u, onResults);
    await u.click(screen.getByRole("button", { name: /Continue to feedback/ }));
    await runUntil(u, onThanks);
    expect(peekRespondentId()).toBeNull();
    await u.click(screen.getByRole("button", { name: /Back to modules/ }));
    await startFlow(u);
    expect(peekRespondentId()).not.toBe(first);
  });

  it("is kept when quitting mid-flow so the student resumes under the same id", async () => {
    const u = user();
    render(<App />);
    await startFlow(u);
    const id = peekRespondentId();
    await answerAndAdvance(u);
    await u.click(screen.getByText("← Modules"));
    await startFlow(u);
    expect(peekRespondentId()).toBe(id);
  });
});

describe("after-quiz survey submits answers (#97)", () => {
  async function toAfter(u) {
    await startFlow(u);
    await runUntil(u, () => stage().includes("After-quiz survey"));
  }

  it("results stay locked until the after survey is submitted", async () => {
    const u = user();
    render(<App />);
    await toAfter(u);
    expect(onResults()).toBe(false);
    const n = getSurveyItems(modules[0]).length;
    for (let i = 0; i < n - 1; i++) await answerAndAdvance(u);
    expect(onResults()).toBe(false); // last question still pending
    await answerAndAdvance(u);
    expect(onResults()).toBe(true);
  });

  it("saves every after-quiz answer with the respondent id (5 test students)", async () => {
    for (let student = 1; student <= 5; student++) {
      localStorage.clear();
      const u = user();
      const { unmount } = render(<App />);
      await startFlow(u);
      const id = peekRespondentId();
      await runUntil(u, () => stage().includes("After-quiz survey"));
      const items = getSurveyItems(modules[0]);
      for (let i = 0; i < items.length; i++) await answerAndAdvance(u, { value: String((i % 5) + 1) });
      const after = getRecords().filter((r) => r.surveyType === "after");
      expect(after).toHaveLength(items.length);
      after.forEach((r, i) => {
        expect(r.respondentId).toBe(id);
        expect(r.questionId).toBe(items[i].id);
        expect(r.answer).toBe((i % 5) + 1); // saved value equals what was entered
      });
      unmount();
    }
  }, 60000);

  it("edge: changing an answer before submitting saves the final value, no duplicates", async () => {
    const u = user();
    render(<App />);
    await toAfter(u);
    await u.click(screen.getByRole("button", { name: "2" }));
    await u.click(screen.getByRole("button", { name: "5" }));
    await u.click(screen.getByRole("button", { name: "Next" }));
    const rows = getRecords().filter((r) => r.surveyType === "after");
    expect(rows).toHaveLength(1);
    expect(rows[0].answer).toBe(5);
  });

  it("edge: refreshing mid-survey keeps earlier answers and shows them again", async () => {
    const u = user();
    const first = render(<App />);
    await toAfter(u);
    await u.click(screen.getByRole("button", { name: "2" }));
    first.unmount(); // simulate a page refresh: React state gone, localStorage kept
    const u2 = user();
    render(<App />);
    await startFlow(u2);
    // Journey restarts at "before", whose answers (from the earlier run) are restored.
    const beforeAnswers = getRecords().filter((r) => r.surveyType === "before");
    expect(beforeAnswers.length).toBeGreaterThan(0);
    expect(getRecords().find((r) => r.surveyType === "after").answer).toBe(2);
    // restored answer is shown as selected, so Next is already enabled
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("edge: leaving and returning does not lose the answers already saved", async () => {
    const u = user();
    render(<App />);
    await toAfter(u);
    await answerAndAdvance(u);
    const count = getRecords().filter((r) => r.surveyType === "after").length;
    await u.click(screen.getByText("← Modules"));
    expect(getRecords().filter((r) => r.surveyType === "after")).toHaveLength(count);
  });

  it("edge: skipping the optional feedback prompts still completes and saves nothing invalid", async () => {
    const u = user();
    render(<App />);
    await startFlow(u);
    await runUntil(u, onResults);
    await u.click(screen.getByRole("button", { name: /Continue to feedback/ }));
    await runUntil(u, onThanks, { skip: true });
    const fb = getRecords().filter((r) => r.surveyType === "feedback");
    expect(fb).toHaveLength(0); // skipped = no record, not a blank/corrupt one
    expect(onThanks()).toBe(true);
  });

  it("feedback answers are stored verbatim with tags", async () => {
    const u = user();
    render(<App />);
    await startFlow(u);
    await runUntil(u, onResults);
    await u.click(screen.getByRole("button", { name: /Continue to feedback/ }));
    await runUntil(u, onThanks);
    const fb = getRecords().filter((r) => r.surveyType === "feedback");
    expect(fb).toHaveLength(getFeedbackQuestions(modules[0]).length);
    const tagged = fb.find((r) => r.answer.tags);
    expect(tagged.answer.text).toBe("It was fine, “quoted” text");
    expect(tagged.answer.tags.length).toBeGreaterThan(0);
    const rated = fb.find((r) => "rating" in r.answer);
    expect(rated.answer.rating).toBe(4); // helper clicks "4"
  });
});

describe("Unity-driven entry points", () => {
  it("window.MentaMorphSurvey.start opens a given survey; startJourney begins the flow", async () => {
    render(<App />);
    await waitFor(() => expect(window.MentaMorphSurvey).toBeDefined());
    window.MentaMorphSurvey.startJourney("m2");
    await screen.findByText(/Saving & Compound Interest · Before-quiz survey/);
    window.MentaMorphSurvey.reset();
    await screen.findByText("Choose a module");
    window.MentaMorphSurvey.start("m3", "post");
    await screen.findByText(/Credit & Monthly Payments · Post-survey/);
  });

  it("ignores unknown modules and survey types instead of crashing", async () => {
    render(<App />);
    await waitFor(() => expect(window.MentaMorphSurvey).toBeDefined());
    window.MentaMorphSurvey.start("nope", "pre");
    window.MentaMorphSurvey.start("m1", "bogus");
    expect(screen.getByText("Choose a module")).toBeInTheDocument();
  });

  it("emits survey_started, answer and survey_completed events with the respondent id", async () => {
    const events = [];
    const h = (e) => events.push(e.detail);
    window.addEventListener("mentamorph:survey", h);
    const u = user();
    render(<App />);
    await startFlow(u);
    await runUntil(u, () => stage().includes("Quiz"));
    window.removeEventListener("mentamorph:survey", h);
    const types = new Set(events.map((e) => e.event));
    expect(types).toEqual(new Set(["survey_started", "answer", "survey_completed"]));
    const id = peekRespondentId();
    expect(events.every((e) => e.payload.respondentId === id)).toBe(true);
  });
});

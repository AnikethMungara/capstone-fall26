import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "../components/Dashboard.jsx";
import JourneyResults from "../components/JourneyResults.jsx";
import { modules } from "../data/modules.js";
import { getSurveyItems } from "../data/surveys.js";
import { saveAnswer } from "../records.js";
import { scoreAttempt } from "../scoring.js";

function seed(respondent, moduleId, before, after) {
  const items = getSurveyItems(modules.find((m) => m.id === moduleId));
  items.forEach((it, i) => {
    saveAnswer({ respondentId: respondent, surveyType: "before", moduleId, questionId: it.id, conceptId: it.conceptId, answer: before });
    saveAnswer({ respondentId: respondent, surveyType: "after", moduleId, questionId: it.id, conceptId: it.conceptId, answer: after });
  });
}

describe("Dashboard (#85)", () => {
  it("shows an empty-state message when no respondent has both surveys", () => {
    render(<Dashboard modules={modules} onBack={() => {}} />);
    expect(screen.getByText(/No respondent has finished both/)).toBeInTheDocument();
  });

  it("with real records, shows 2 charts with title, axis labels and n", () => {
    seed("a", "m1", 2, 4);
    seed("b", "m1", 3, 3);
    render(<Dashboard modules={modules} onBack={() => {}} />);
    expect(screen.getAllByRole("figure")).toHaveLength(2);
    expect(screen.getByText("Average confidence by topic")).toBeInTheDocument();
    expect(screen.getByText("Change in confidence per respondent")).toBeInTheDocument();
    expect(screen.getAllByText(/n = 2/)).toHaveLength(2);
    expect(screen.getAllByText(/indicative/)).toHaveLength(2);
    expect(screen.getByText("Mean rating (1–5)")).toBeInTheDocument();
    expect(screen.getAllByText("Respondents").length).toBeGreaterThanOrEqual(1); // y-axis label (+ legend)
  });

  it("only counts respondents who have BOTH before and after", () => {
    seed("a", "m1", 2, 4);
    const it0 = getSurveyItems(modules[0])[0];
    saveAnswer({ respondentId: "only-before", surveyType: "before", moduleId: "m1", questionId: it0.id, conceptId: it0.conceptId, answer: 1 });
    render(<Dashboard modules={modules} onBack={() => {}} />);
    expect(screen.getAllByText(/n = 1/)).toHaveLength(2);
  });

  it("buckets improved / no change / declined correctly", () => {
    seed("up", "m1", 1, 5);
    seed("same", "m1", 3, 3);
    seed("down", "m1", 5, 2);
    const { container } = render(<Dashboard modules={modules} onBack={() => {}} />);
    const text = container.textContent;
    for (const label of ["Declined", "No change", "Improved"]) expect(text).toContain(label);
    expect(screen.getAllByText(/n = 3/)).toHaveLength(2);
  });

  it("switching module shows that module's data only", async () => {
    seed("a", "m2", 2, 4);
    render(<Dashboard modules={modules} onBack={() => {}} />);
    expect(screen.getByText(/No respondent has finished both/)).toBeInTheDocument(); // m1 selected
    await userEvent.selectOptions(screen.getByRole("combobox"), "m2");
    expect(screen.getAllByRole("figure")).toHaveLength(2);
  });

  it("demo data makes exactly 30 respondents and is labelled DEMO, and not marked indicative", async () => {
    render(<Dashboard modules={modules} onBack={() => {}} />);
    await userEvent.click(screen.getByLabelText(/Demo data/));
    expect(screen.getByText(/DEMO DATA/)).toBeInTheDocument();
    expect(screen.getAllByText(/n = 30/)).toHaveLength(2);
    expect(screen.queryByText(/indicative/)).toBeNull();
  });

  it("offers CSV and JSON download", () => {
    render(<Dashboard modules={modules} onBack={() => {}} />);
    expect(screen.getByRole("button", { name: "Download CSV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download JSON" })).toBeInTheDocument();
  });
});

describe("JourneyResults", () => {
  it("shows quiz score and each item's before -> after change", () => {
    const m = modules[0];
    const items = getSurveyItems(m);
    const before = scoreAttempt(items, Object.fromEntries(items.map((q) => [q.id, 2])));
    const after = scoreAttempt(items, Object.fromEntries(items.map((q) => [q.id, 4])));
    const quiz = { correct: 3, total: 4 };
    render(<JourneyResults module={m} attempts={{ before, after, quiz }} onFeedback={() => {}} onDone={() => {}} />);
    expect(screen.getByText("3/4")).toBeInTheDocument();
    expect(screen.getAllByText("2 → 4")).toHaveLength(4);
    expect(screen.getAllByText("+2")).toHaveLength(4);
  });
});

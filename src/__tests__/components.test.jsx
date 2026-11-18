import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionBody from "../components/QuestionBody.jsx";
import Question from "../components/Question.jsx";
import BarChart from "../components/BarChart.jsx";
import { modules, getQuestions } from "../data/modules.js";
import { getSurveyItems } from "../data/surveys.js";
import { feedbackPrompts, getFeedbackQuestions } from "../data/feedback.js";
import { sendToUnity } from "../bridge/unityBridge.js";

// Stateful wrapper so controlled inputs behave like they do in the app.
function Harness({ q, onChange }) {
  const [v, setV] = useState(undefined);
  return <QuestionBody q={q} response={v} onAnswer={(x) => { setV(x); onChange?.(x); }} />;
}

describe("type switch (#99): 30 of 30 renders pick the right component", () => {
  const sample = [
    ...getQuestions(modules[0], "A"),
    ...getQuestions(modules[1], "B"),
    ...getQuestions(modules[2], "C"),
    ...getQuestions(modules[3], "A"),
    ...modules.flatMap(getSurveyItems),
    ...getFeedbackQuestions(modules[0]),
  ];

  it("has at least 30 questions in the sample", () => expect(sample.length).toBeGreaterThanOrEqual(30));

  it.each(sample.slice(0, 40).map((q) => [q.id, q]))("renders %s", (_id, q) => {
    const { container } = render(<Harness q={q} />);
    expect(screen.queryByText(/can’t be shown/)).toBeNull();
    if (q.type === "single" || q.type === "multi") {
      expect(container.querySelectorAll(".option")).toHaveLength(q.options.length);
    } else if (q.type === "scale") {
      expect(container.querySelectorAll(".dot")).toHaveLength(5);
    } else if (q.type === "tagtext") {
      expect(container.querySelectorAll(".tag-chip")).toHaveLength(q.tags.length);
      expect(container.querySelector("textarea")).toBeInTheDocument();
    } else if (q.type === "ratingtext") {
      expect(container.querySelectorAll(".dot")).toHaveLength(5);
      expect(container.querySelector("textarea")).toBeInTheDocument();
    }
  });

  it("unknown type shows a fallback message and logs an error (0 crashes)", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<QuestionBody q={{ id: "x.1", type: "hologram", text: "?" }} onAnswer={() => {}} />);
    expect(screen.getByText(/unknown type “hologram”/)).toBeInTheDocument();
    expect(err).toHaveBeenCalledWith(expect.stringContaining("hologram"));
    err.mockRestore();
  });
});

describe("single / multi selection", () => {
  it("single: picking another option replaces the first", async () => {
    const onChange = vi.fn();
    const q = getQuestions(modules[0], "A")[0];
    render(<Harness q={q} onChange={onChange} />);
    await userEvent.click(screen.getByText(q.options[1]));
    await userEvent.click(screen.getByText(q.options[2]));
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("multi: toggles values on and off", async () => {
    const onChange = vi.fn();
    const q = getQuestions(modules[0], "A")[2];
    render(<Harness q={q} onChange={onChange} />);
    await userEvent.click(screen.getByText(q.options[0]));
    await userEvent.click(screen.getByText(q.options[2]));
    expect(onChange).toHaveBeenLastCalledWith([0, 2]);
    await userEvent.click(screen.getByText(q.options[0]));
    expect(onChange).toHaveBeenLastCalledWith([2]);
  });
});

describe("feedback components (#82)", () => {
  const ratingQ = getFeedbackQuestions(modules[0]).find((q) => q.type === "ratingtext");
  const tagQ = getFeedbackQuestions(modules[0]).find((q) => q.type === "tagtext");

  it("rating offers exactly 1-5 and nothing else", () => {
    render(<Harness q={ratingQ} />);
    const labels = screen.getAllByRole("button").map((b) => b.textContent);
    expect(labels).toEqual(["1", "2", "3", "4", "5"]);
    expect(screen.queryByRole("button", { name: "0" })).toBeNull();
    expect(screen.queryByRole("button", { name: "6" })).toBeNull();
  });

  it("rating selection is stored with the comment", async () => {
    const onChange = vi.fn();
    render(<Harness q={ratingQ} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "4" }));
    expect(onChange).toHaveBeenLastCalledWith({ rating: 4, text: "" });
    await userEvent.type(screen.getByRole("textbox"), "ok");
    expect(onChange).toHaveBeenLastCalledWith({ rating: 4, text: "ok" });
  });

  it("free text stops at 500 characters and the counter shows it", () => {
    render(<Harness q={tagQ} />);
    const box = screen.getByRole("textbox");
    expect(box).toHaveAttribute("maxlength", "500");
    fireEvent.change(box, { target: { value: "x".repeat(700) } });
    expect(box.value).toHaveLength(500);
    expect(screen.getByText("500/500")).toBeInTheDocument();
  });

  it("counter updates as you type", async () => {
    render(<Harness q={tagQ} />);
    expect(screen.getByText("0/500")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox"), "hello");
    expect(screen.getByText("5/500")).toBeInTheDocument();
  });

  it("tags toggle on and off independently of the text", async () => {
    const onChange = vi.fn();
    render(<Harness q={tagQ} onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox"), "hi");
    await userEvent.click(screen.getByRole("button", { name: tagQ.tags[0] }));
    await userEvent.click(screen.getByRole("button", { name: tagQ.tags[1] }));
    expect(onChange).toHaveBeenLastCalledWith({ tags: [tagQ.tags[0], tagQ.tags[1]], text: "hi" });
    await userEvent.click(screen.getByRole("button", { name: tagQ.tags[0] }));
    expect(onChange).toHaveBeenLastCalledWith({ tags: [tagQ.tags[1]], text: "hi" });
  });

  it("every feedback prompt has non-empty placeholder text", () => {
    for (const p of feedbackPrompts) expect(p.placeholder, p.id).toBeTruthy();
  });
});

describe("Question shell", () => {
  const mod = modules[0];
  const props = (over = {}) => ({
    module: mod, phase: { label: "Before-quiz survey" }, index: 0, total: 3,
    onAnswer: () => {}, onNext: () => {}, onExit: () => {}, ...over,
  });
  const scaleQ = getSurveyItems(mod)[0];

  it("Next is disabled until a required question is answered", () => {
    const { rerender } = render(<Question {...props({ question: scaleQ, response: undefined })} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    rerender(<Question {...props({ question: scaleQ, response: 3 })} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("answer 0 counts as answered (single option index 0)", () => {
    render(<Question {...props({ question: getQuestions(mod, "A")[0], response: 0 })} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("multi needs at least one selection", () => {
    const q = getQuestions(mod, "A")[2];
    const { rerender } = render(<Question {...props({ question: q, response: [] })} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    rerender(<Question {...props({ question: q, response: [1] })} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("feedback questions can be skipped (optional)", () => {
    render(<Question {...props({ question: getFeedbackQuestions(mod)[0], response: undefined })} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("last question says Submit and disables while sending (#82)", async () => {
    let resolve;
    const onNext = vi.fn(() => new Promise((r) => (resolve = r)));
    render(<Question {...props({ question: scaleQ, response: 3, index: 2, total: 3, onNext })} />);
    const btn = screen.getByRole("button", { name: "Submit" });
    await userEvent.click(btn);
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Sending…" })); // double-click ignored
    expect(onNext).toHaveBeenCalledTimes(1);
    resolve();
    await waitFor(() => expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled());
  });

  it("shows progress and exit goes back", async () => {
    const onExit = vi.fn();
    render(<Question {...props({ question: scaleQ, response: 1, index: 1, total: 4, onExit })} />);
    expect(screen.getByText(/2\/4/)).toBeInTheDocument();
    await userEvent.click(screen.getByText("← Modules"));
    expect(onExit).toHaveBeenCalled();
  });

  it("never reveals correctness during a survey", () => {
    const q = getQuestions(mod, "A")[0];
    render(<Question {...props({ question: q, response: q.answer })} />);
    expect(screen.queryByText(/Correct/)).toBeNull();
    expect(document.querySelector(".correct, .wrong")).toBeNull();
  });
});

describe("BarChart (#85)", () => {
  const groups = [{ label: "A", values: [2, 4] }];
  it("shows title, both axis labels and n", () => {
    render(<BarChart title="T" xLabel="Topic" yLabel="Mean" groups={groups} series={["Before", "After"]} yMax={5} n={42} />);
    expect(screen.getByText("T")).toBeInTheDocument();
    expect(screen.getByText("Topic")).toBeInTheDocument();
    expect(screen.getByText("Mean")).toBeInTheDocument();
    expect(screen.getByText(/n = 42/)).toBeInTheDocument();
    expect(screen.queryByText(/indicative/)).toBeNull();
  });
  it("marks n under 30 as indicative", () => {
    render(<BarChart title="T" xLabel="x" yLabel="y" groups={groups} series={["a", "b"]} yMax={5} n={29} />);
    expect(screen.getByText(/indicative/)).toBeInTheDocument();
  });
  it("n of exactly 30 is not indicative", () => {
    render(<BarChart title="T" xLabel="x" yLabel="y" groups={groups} series={["a", "b"]} yMax={5} n={30} />);
    expect(screen.queryByText(/indicative/)).toBeNull();
  });
  it("draws one bar per value", () => {
    const { container } = render(<BarChart title="T" xLabel="x" yLabel="y" groups={[{ label: "a", values: [1, 2] }, { label: "b", values: [3, 4] }]} series={["a", "b"]} yMax={5} n={5} />);
    expect(container.querySelectorAll("rect")).toHaveLength(4);
  });
});

describe("Unity bridge", () => {
  it("calls SendMessage with a JSON envelope when running inside Unity", () => {
    const SendMessage = vi.fn();
    window.unityInstance = { SendMessage };
    sendToUnity("answer", { a: 1 });
    expect(SendMessage).toHaveBeenCalledWith("SurveyManager", "OnSurveyEvent", expect.any(String));
    const msg = JSON.parse(SendMessage.mock.calls[0][2]);
    expect(msg).toMatchObject({ event: "answer", payload: { a: 1 } });
    expect(typeof msg.ts).toBe("number");
    delete window.unityInstance;
  });
  it("only logs outside Unity and still emits a DOM event", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const seen = vi.fn();
    window.addEventListener("mentamorph:survey", seen);
    sendToUnity("survey_started", {});
    expect(info).toHaveBeenCalled();
    expect(seen).toHaveBeenCalled();
    window.removeEventListener("mentamorph:survey", seen);
    info.mockRestore();
  });
});

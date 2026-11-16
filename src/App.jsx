import { useCallback, useEffect, useState } from "react";
import { modules, phases, getQuestions } from "./data/modules.js";
import { scoreAttempt, isCorrect } from "./scoring.js";
import { sendToUnity } from "./bridge/unityBridge.js";
import ModuleSelect from "./components/ModuleSelect.jsx";
import Question from "./components/Question.jsx";
import Results from "./components/Results.jsx";

// screen: "select" | "survey" | "results"
export default function App() {
  const [screen, setScreen] = useState("select");
  const [run, setRun] = useState(null); // { moduleId, phase, questions }
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  // attempts[moduleId][phase] = scoreAttempt() result
  const [attempts, setAttempts] = useState({});

  const start = useCallback((moduleId, phase) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod || !phases[phase]) return;
    const form = phases[phase].form;
    setRun({ moduleId, phase, form, questions: getQuestions(mod, form) });
    setAnswers({});
    setIndex(0);
    setScreen("survey");
    sendToUnity("survey_started", { moduleId, phase, form });
  }, []);

  const reset = useCallback(() => {
    setScreen("select");
    setRun(null);
  }, []);

  // Let the game drive the shell: window.MentaMorphSurvey.start("m2", "pre")
  useEffect(() => {
    window.MentaMorphSurvey = { start, reset };
    return () => delete window.MentaMorphSurvey;
  }, [start, reset]);

  const handleAnswer = (q, value) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    sendToUnity("answer", {
      moduleId: run.moduleId, phase: run.phase, form: run.form,
      questionId: q.id, conceptId: q.conceptId, value,
      correct: q.type === "scale" ? null : isCorrect(q, value),
    });
  };

  const next = () => {
    if (index < run.questions.length - 1) return setIndex(index + 1);
    const result = scoreAttempt(run.questions, answers);
    setAttempts((a) => ({ ...a, [run.moduleId]: { ...a[run.moduleId], [run.phase]: result } }));
    setScreen("results");
    sendToUnity("survey_completed", {
      moduleId: run.moduleId, phase: run.phase, form: run.form,
      correct: result.correct, total: result.total, scaleAvg: result.scaleAvg, answers,
    });
  };

  const mod = run && modules.find((m) => m.id === run.moduleId);
  const q = run?.questions[index];

  return (
    <main className="shell">
      <header className="topbar">
        <span className="brand">MentaMorph</span>
        <span className="tag">Survey prototype · not final</span>
      </header>

      {screen === "select" && <ModuleSelect modules={modules} phases={phases} attempts={attempts} onPick={start} />}
      {screen === "survey" && (
        <Question
          key={q.id}
          module={mod}
          phase={phases[run.phase]}
          question={q}
          index={index}
          total={run.questions.length}
          response={answers[q.id]}
          onAnswer={(v) => handleAnswer(q, v)}
          onNext={next}
          onExit={reset}
        />
      )}
      {screen === "results" && (
        <Results
          module={mod}
          phases={phases}
          phase={run.phase}
          attempts={attempts[mod.id]}
          onRetry={() => start(mod.id, run.phase)}
          onDone={reset}
        />
      )}
    </main>
  );
}

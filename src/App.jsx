import { useCallback, useEffect, useState } from "react";
import { modules, phases, getQuestions } from "./data/modules.js";
import { getFeedbackQuestions } from "./data/feedback.js";
import { getSurveyItems, surveyLabels } from "./data/surveys.js";
import { scoreAttempt, isCorrect, isGraded } from "./scoring.js";
import { getRespondentId, peekRespondentId, clearRespondent } from "./respondent.js";
import { saveAnswer, getAnswersFor, getRecords, submitRecords } from "./records.js";
import { sendToUnity } from "./bridge/unityBridge.js";
import ModuleSelect from "./components/ModuleSelect.jsx";
import Question from "./components/Question.jsx";
import Results from "./components/Results.jsx";
import JourneyResults from "./components/JourneyResults.jsx";
import Dashboard from "./components/Dashboard.jsx";

// Questions for a survey type. before/after = confidence surveys, quiz = the
// graded knowledge check, feedback = qualitative, pre/post/followup = the
// parallel graded forms A/B/C kept for standalone testing.
function buildQuestions(mod, type) {
  if (type === "before" || type === "after") return getSurveyItems(mod);
  if (type === "quiz") return getQuestions(mod, "A").filter((q) => q.type !== "scale");
  if (type === "feedback") return getFeedbackQuestions(mod);
  return getQuestions(mod, phases[type].form);
}

// screen: "select" | "survey" | "results" | "journeyResults" | "dashboard"
export default function App() {
  const [screen, setScreen] = useState("select");
  const [run, setRun] = useState(null); // { moduleId, type, journey, questions, respondentId }
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState({}); // attempts[moduleId][type] = scoreAttempt()
  const [respondent, setRespondent] = useState(peekRespondentId());

  const begin = useCallback((moduleId, type, journey = false) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod || !surveyLabels[type]) return;
    const respondentId = getRespondentId();
    setRespondent(respondentId);
    // Prefill from storage so a refresh keeps earlier answers.
    setAnswers(getAnswersFor(respondentId, type, moduleId));
    setRun({ moduleId, type, journey, respondentId, questions: buildQuestions(mod, type) });
    setIndex(0);
    setScreen("survey");
    sendToUnity("survey_started", { moduleId, surveyType: type, respondentId, journey });
  }, []);

  const reset = useCallback(() => {
    setScreen("select");
    setRun(null);
  }, []);

  const newRespondent = () => {
    clearRespondent();
    setRespondent(null);
  };

  // Let the game drive the shell.
  useEffect(() => {
    window.MentaMorphSurvey = {
      start: (moduleId, type = "before") => begin(moduleId, type),
      startJourney: (moduleId) => begin(moduleId, "before", true),
      reset,
    };
    return () => delete window.MentaMorphSurvey;
  }, [begin, reset]);

  const handleAnswer = (q, value) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    saveAnswer({
      respondentId: run.respondentId, surveyType: run.type, moduleId: run.moduleId,
      questionId: q.id, conceptId: q.conceptId, answer: value,
    });
    sendToUnity("answer", {
      respondentId: run.respondentId, moduleId: run.moduleId, surveyType: run.type,
      questionId: q.id, conceptId: q.conceptId, value,
      correct: isGraded(q) ? isCorrect(q, value) : null,
    });
  };

  const next = async () => {
    if (index < run.questions.length - 1) return setIndex(index + 1);

    const result = scoreAttempt(run.questions, answers);
    setAttempts((a) => ({ ...a, [run.moduleId]: { ...a[run.moduleId], [run.type]: result } }));
    const mine = getRecords().filter(
      (r) => r.respondentId === run.respondentId && r.surveyType === run.type && r.moduleId === run.moduleId,
    );
    await submitRecords(mine);
    sendToUnity("survey_completed", {
      respondentId: run.respondentId, moduleId: run.moduleId, surveyType: run.type,
      correct: result.correct, total: result.total, scaleAvg: result.scaleAvg,
    });

    if (!run.journey) return setScreen("results");
    // Full flow: before -> quiz -> after -> (results unlocked) -> feedback.
    if (run.type === "before") return begin(run.moduleId, "quiz", true);
    if (run.type === "quiz") return begin(run.moduleId, "after", true);
    if (run.type === "after") return setScreen("journeyResults");
    if (run.type === "feedback") {
      clearRespondent();
      setRespondent(null);
      setScreen("results");
    }
  };

  const mod = run && modules.find((m) => m.id === run.moduleId);
  const q = run?.questions[index];

  return (
    <main className="shell">
      <header className="topbar">
        <span className="brand">MentaMorph</span>
        <span className="tag">Survey prototype · not final</span>
      </header>

      {screen === "select" && (
        <ModuleSelect
          modules={modules} phases={phases} attempts={attempts} respondent={respondent}
          onPick={(id, type) => begin(id, type)} onJourney={(id) => begin(id, "before", true)}
          onNewRespondent={newRespondent} onDashboard={() => setScreen("dashboard")}
        />
      )}
      {screen === "survey" && (
        <Question
          key={`${run.type}-${q.id}`}
          module={mod}
          phase={{ label: surveyLabels[run.type] }}
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
          module={mod} phases={phases} phase={run.type} attempts={attempts[mod.id]}
          onRetry={() => begin(mod.id, run.type, run.journey)} onDone={reset}
        />
      )}
      {screen === "journeyResults" && (
        <JourneyResults
          module={mod} attempts={attempts[mod.id]}
          onFeedback={() => begin(mod.id, "feedback", true)} onDone={reset}
        />
      )}
      {screen === "dashboard" && <Dashboard modules={modules} onBack={reset} />}
    </main>
  );
}

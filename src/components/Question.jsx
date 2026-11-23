import { useState } from "react";
import QuestionBody from "./QuestionBody.jsx";

export default function Question({ module, phase, question: q, index, total, response, onAnswer, onNext, onBack, onExit }) {
  const [busy, setBusy] = useState(false);
  const last = index === total - 1;
  const selectedCount = q.type === "multi" && Array.isArray(response) ? response.length : 0;
  const hasAnswer = q.type === "tagtext"
    ? (Array.isArray(response?.tags) && response.tags.length > 0) || Boolean(response?.text?.trim())
    : q.type === "ratingtext"
      ? Number.isInteger(response?.rating) && response.rating >= 1 && response.rating <= 5
      : q.type === "multi"
        ? selectedCount > 0
        : response !== undefined && response !== null && response !== "";
  const progressCount = index + (hasAnswer ? 1 : 0);

  const go = async () => {
    if (!hasAnswer || busy) return;
    setBusy(true);
    try { await onNext(); } finally { setBusy(false); }
  };

  return (
    <section className="question-screen">
      <div className="row question-topline">
        <button className="link" onClick={onExit}>← Modules</button>
        <span className="muted">{module.title} · {phase.label}</span>
      </div>
      <div className="question-card">
        <div className="row question-meta">
          <span className="eyebrow">{phase.label}</span>
          <span className="question-count">Question {index + 1} of {total}</span>
        </div>
        <div className="progress" role="progressbar" aria-label="Question progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={progressCount}>
          <div style={{ width: `${(progressCount / total) * 100}%` }} />
        </div>
        <h2>{q.text}</h2>
        <QuestionBody q={q} response={response} onAnswer={onAnswer} />

        <div className="actions">
          {onBack && index > 0 && <button className="secondary" disabled={busy} onClick={onBack}>← Previous</button>}
          <button className="primary" disabled={!hasAnswer || busy} onClick={go}>
            {busy ? "Sending…" : last ? "Submit" : "Next"}
            {!last && !busy && <span aria-hidden="true"> →</span>}
          </button>
        </div>
      </div>
      <p className="question-footnote">Your responses are saved as you go. Correct answers appear in the results.</p>
    </section>
  );
}

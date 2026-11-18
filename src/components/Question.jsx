import { useState } from "react";
import QuestionBody, { optionalTypes } from "./QuestionBody.jsx";

// Assessment-style: no right/wrong reveal while taking surveys; answers are
// reviewed on the results screen. The final button disables while sending (#82).
export default function Question({ module, phase, question: q, index, total, response, onAnswer, onNext, onExit }) {
  const [busy, setBusy] = useState(false);
  const last = index === total - 1;
  const hasAnswer = optionalTypes.includes(q.type)
    ? true
    : q.type === "multi" ? response?.length > 0 : response !== undefined;

  const go = async () => {
    setBusy(true);
    try {
      await onNext();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className="row">
        <button className="link" onClick={onExit}>← Modules</button>
        <span className="muted">{module.title} · {phase.label} · {index + 1}/{total}</span>
      </div>
      <div className="progress"><div style={{ width: `${(index / total) * 100}%` }} /></div>

      <h2>{q.text}</h2>
      <QuestionBody q={q} response={response} onAnswer={onAnswer} />

      <div className="actions">
        <button className="primary" disabled={!hasAnswer || busy} onClick={go}>
          {busy ? "Sending…" : last ? "Submit" : "Next"}
        </button>
      </div>
    </section>
  );
}

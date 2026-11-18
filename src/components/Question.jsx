import QuestionBody, { optionalTypes } from "./QuestionBody.jsx";

// Assessment-style: no right/wrong reveal while taking surveys; answers are
// reviewed on the results screen.
export default function Question({ module, phase, question: q, index, total, response, onAnswer, onNext, onExit }) {
  const hasAnswer = optionalTypes.includes(q.type)
    ? true
    : q.type === "multi" ? response?.length > 0 : response !== undefined;

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
        <button className="primary" disabled={!hasAnswer} onClick={onNext}>
          {index === total - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </section>
  );
}

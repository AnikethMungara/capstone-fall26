// Assessment-style question: no right/wrong reveal while taking pre/post
// surveys; answers are reviewed on the results screen.
export default function Question({ module, phase, question: q, index, total, response, onAnswer, onNext, onExit }) {
  const toggle = (i) => {
    if (q.type === "multi") {
      const cur = response ?? [];
      onAnswer(cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]);
    } else {
      onAnswer(i);
    }
  };

  const selected = (i) => (q.type === "multi" ? response?.includes(i) : response === i);
  const hasAnswer = q.type === "multi" ? response?.length > 0 : response !== undefined;

  return (
    <section>
      <div className="row">
        <button className="link" onClick={onExit}>← Modules</button>
        <span className="muted">{module.title} · {phase.label} · {index + 1}/{total}</span>
      </div>
      <div className="progress"><div style={{ width: `${(index / total) * 100}%` }} /></div>

      <h2>{q.text}</h2>
      {q.type === "multi" && <p className="muted">Select all that apply.</p>}

      {q.type === "scale" ? (
        <div>
          <div className="scale">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className={response === n ? "dot selected" : "dot"} onClick={() => onAnswer(n)}>{n}</button>
            ))}
          </div>
          <div className="row muted"><span>{q.scaleLabels[0]}</span><span>{q.scaleLabels[1]}</span></div>
        </div>
      ) : (
        <div className="options">
          {q.options.map((o, i) => (
            <button key={i} className={selected(i) ? "option selected" : "option"} onClick={() => toggle(i)}>
              <span className="mark">{q.type === "multi" ? (selected(i) ? "☑" : "☐") : selected(i) ? "●" : "○"}</span>{o}
            </button>
          ))}
        </div>
      )}

      <div className="actions">
        <button className="primary" disabled={!hasAnswer} onClick={onNext}>
          {index === total - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </section>
  );
}

// Unlocked only once the after-quiz survey is submitted. Shows the quiz score
// and this respondent's before vs after confidence.
export default function JourneyResults({ module, attempts, onFeedback, onDone }) {
  const { before, quiz, after } = attempts;
  const rows = before.items.map((b, i) => ({
    label: b.question.short ?? b.question.text,
    before: b.response,
    after: after.items[i]?.response,
  }));
  const diff = (r) => (r.before != null && r.after != null ? r.after - r.before : null);

  return (
    <section>
      <div className="center">
        <div className="icon big">{module.icon}</div>
        <h1>{module.title}: your results</h1>
        <p className="score">{quiz.correct}/{quiz.total} <span className="muted">quiz</span></p>
      </div>

      <div className="review">
        <h3>Confidence before vs after</h3>
        {rows.map((r) => (
          <div key={r.label} className="compare-row">
            <span>{r.label}</span>
            <span className="muted">{r.before ?? "–"} → {r.after ?? "–"}</span>
            {diff(r) !== null && (
              <span className={diff(r) > 0 ? "delta up" : diff(r) < 0 ? "delta down" : "muted"}>
                {diff(r) > 0 ? "+" : ""}{diff(r)}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="actions center">
        <button onClick={onDone}>Skip feedback</button>
        <button className="primary" onClick={onFeedback}>Continue to feedback</button>
      </div>
    </section>
  );
}

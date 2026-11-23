// Results from the complete before -> quiz -> after journey.
// Confidence is self-reported, so it is shown separately from the quiz score.
export default function JourneyResults({ module, attempts, onFeedback, onDone }) {
  const { before, quiz, after } = attempts;
  const rows = before.items.map((item, index) => ({
    label: item.question.short ?? item.question.text,
    before: item.response,
    after: after.items[index]?.response,
  }));

  const validRows = rows.filter((row) => Number.isFinite(row.before) && Number.isFinite(row.after));
  const average = (values) => values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
  const beforeAvg = average(validRows.map((row) => row.before));
  const afterAvg = average(validRows.map((row) => row.after));
  const averageChange = beforeAvg === null || afterAvg === null ? null : afterAvg - beforeAvg;
  const quizPercent = quiz.total > 0 ? Math.round((quiz.correct / quiz.total) * 100) : 0;
  const displayRating = (value) => value === null ? "—" : `${value.toFixed(1)}/5`;
  const changeLabel = (change) => change === null ? "Not rated"
    : change > 0 ? `+${change.toFixed(1)}`
    : change < 0 ? change.toFixed(1)
    : "No change";
  const changeClass = (change) => change === null || change === 0 ? ""
    : change > 0 ? "positive" : "negative";
  const barWidth = (value) => Number.isFinite(value)
    ? `${Math.max(0, Math.min(100, (value / 5) * 100))}%`
    : "0%";

  return (
    <section className="results-screen">
      <div className="results-hero">
        <div className="results-hero-copy">
          <p className="eyebrow">YOUR LEARNING SUMMARY</p>
          <div className="results-heading">
            <span className="results-icon" aria-hidden="true">{module.icon}</span>
            <div>
              <h1>{module.title}: your results</h1>
              <p className="results-lead">You've finished the quiz and both confidence surveys. Here's a summary of your responses.</p>
            </div>
          </div>
          <div className="result-chips">
            <span className="result-chip"><span aria-hidden="true">✓</span> Quiz completed</span>
            <span className="result-chip soft">Before & after surveys completed</span>
          </div>
        </div>
        <div
          className="score-ring"
          role="img"
          aria-label={`Quiz score: ${quiz.correct} of ${quiz.total} correct, ${quizPercent} percent`}
          style={{ "--score-percent": `${quizPercent}%` }}
        >
          <div className="score-ring-inner">
            <strong>{quizPercent}%</strong>
            <span>{quiz.correct}/{quiz.total} correct</span>
            <small>QUIZ SCORE</small>
          </div>
        </div>
      </div>

      <div className="results-stats" aria-label="Confidence summary">
        <article className="result-stat">
          <span className="result-stat-label">Before confidence</span>
          <strong>{displayRating(beforeAvg)}</strong>
          <span className="result-stat-help">Average of paired ratings</span>
        </article>
        <article className="result-stat">
          <span className="result-stat-label">After confidence</span>
          <strong>{displayRating(afterAvg)}</strong>
          <span className="result-stat-help">Average of paired ratings</span>
        </article>
        <article className="result-stat">
          <span className="result-stat-label">Confidence change</span>
          <strong className={changeClass(averageChange)}>{changeLabel(averageChange)}</strong>
          <span className="result-stat-help">Points on a 1–5 scale</span>
        </article>
      </div>

      <div className="confidence-panel">
        <div className="confidence-heading">
          <div>
            <p className="eyebrow">SELF-REPORTED RATINGS</p>
            <h2>Confidence before vs after</h2>
            <p className="muted">Compare each topic on a scale of 1 (low) to 5 (high).</p>
          </div>
          <div className="confidence-legend" aria-label="Chart legend">
            <span><i className="legend-before" aria-hidden="true" /> Before</span>
            <span><i className="legend-after" aria-hidden="true" /> After</span>
          </div>
        </div>

        <div className="confidence-items">
          {rows.map((row, index) => {
            const delta = Number.isFinite(row.before) && Number.isFinite(row.after)
              ? row.after - row.before : null;
            const label = delta === null ? "Not rated"
              : delta === 0 ? "No change"
              : `${delta > 0 ? "+" : ""}${delta} point${Math.abs(delta) === 1 ? "" : "s"}`;
            return (
              <div className="confidence-item" key={`${row.label}-${index}`}>
                <div className="confidence-item-top">
                  <strong>{row.label}</strong>
                  <span className={`confidence-change ${changeClass(delta)}`}>{label}</span>
                </div>
                <div className="confidence-bar-line">
                  <span>Before</span>
                  <div className="confidence-bar-track"><div className="confidence-bar before" style={{ width: barWidth(row.before) }} /></div>
                  <b>{row.before ?? "—"}</b>
                </div>
                <div className="confidence-bar-line">
                  <span>After</span>
                  <div className="confidence-bar-track"><div className="confidence-bar after" style={{ width: barWidth(row.after) }} /></div>
                  <b>{row.after ?? "—"}</b>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="results-disclaimer"><span aria-hidden="true">ⓘ</span> Confidence ratings reflect how confident a learner feels, not a measured knowledge gain. The quiz score is shown separately.</p>

      <div className="actions results-actions">
        <button onClick={onDone}>Skip feedback</button>
        <button className="primary" onClick={onFeedback}>Continue to feedback <span aria-hidden="true">→</span></button>
      </div>
    </section>
  );
}

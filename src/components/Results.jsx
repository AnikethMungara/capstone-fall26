const fmt = (a) => `${a.correct}/${a.total}`;
const pct = (a) => Math.round((a.correct / a.total) * 100);

export default function Results({ module, phases, phase, attempts, onRetry, onDone }) {
  const cur = attempts[phase];
  if (phases[phase].kind === "feedback") return <FeedbackDone module={module} cur={cur} onDone={onDone} />;
  const pre = attempts.pre;
  const compare = phase !== "pre" && pre;
  const delta = compare ? pct(cur) - pct(pre) : null;
  const confDelta = compare && pre.scaleAvg != null && cur.scaleAvg != null ? cur.scaleAvg - pre.scaleAvg : null;

  return (
    <section>
      <div className="center">
        <div className="icon big">{module.icon}</div>
        <h1>{module.title}</h1>
        <p className="muted">{phases[phase].label} complete</p>
        <p className="score">{fmt(cur)} <span className="muted">({pct(cur)}%)</span></p>
      </div>

      {compare && (
        <div className="compare">
          <div><span className="muted">Pre</span><strong>{fmt(pre)}</strong></div>
          <div className="arrow">→</div>
          <div><span className="muted">{phases[phase].label}</span><strong>{fmt(cur)}</strong></div>
          <div className={delta >= 0 ? "delta up" : "delta down"}>{delta >= 0 ? "+" : ""}{delta} pts</div>
          {confDelta !== null && (
            <div className="muted">Avg confidence {pre.scaleAvg.toFixed(1)} → {cur.scaleAvg.toFixed(1)}</div>
          )}
        </div>
      )}

      {phase === "pre" ? (
        <p className="muted center">Answers are hidden until after the post-survey. Now go play the module!</p>
      ) : (
        <div className="review">
          <h3>Review</h3>
          {cur.items.filter((i) => i.correct !== null).map((i) => (
            <div key={i.question.id} className={i.correct ? "feedback ok" : "feedback bad"}>
              <strong>{i.correct ? "✓" : "✗"} {i.question.text}</strong>
              <div className="muted">{i.question.explanation}</div>
            </div>
          ))}
        </div>
      )}

      <div className="actions center">
        <button onClick={onRetry}>Retake</button>
        <button className="primary" onClick={onDone}>Back to modules</button>
      </div>
    </section>
  );
}

function FeedbackDone({ module, cur, onDone }) {
  const rows = cur.items.map((i) => ({
    questionId: i.question.id,
    prompt: i.question.text,
    tags: i.response?.tags ?? [],
    text: i.response?.text ?? "",
  }));
  const download = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${module.id}-feedback.json`;
    a.click();
  };
  return (
    <section>
      <div className="center">
        <div className="icon big">{module.icon}</div>
        <h1>Thanks for the feedback</h1>
        <p className="muted">Your tags and comments for {module.title} were recorded.</p>
      </div>
      <div className="review">
        {rows.map((r) => (
          <div key={r.questionId} className="feedback ok">
            <strong>{r.prompt}</strong>
            <div className="tags">{r.tags.length ? r.tags.map((t) => <span key={t} className="tag-chip on static">{t}</span>) : <span className="muted">No tags</span>}</div>
            {r.text && <div className="quote">“{r.text}”</div>}
          </div>
        ))}
      </div>
      <div className="actions center">
        <button onClick={download}>Download JSON</button>
        <button className="primary" onClick={onDone}>Back to modules</button>
      </div>
    </section>
  );
}

export default function ModuleSelect({ modules, phases, attempts, respondent, onPick, onJourney, onNewRespondent, onDashboard }) {
  return (
    <section>
      <div className="row">
        <h1>Choose a module</h1>
        <button className="link" onClick={onDashboard}>Results dashboard →</button>
      </div>
      <p className="muted">
        Full flow: before-quiz survey → quiz → after-quiz survey → results → feedback.
        All stages share one respondent ID.
      </p>
      <p className="muted respondent">
        Respondent: {respondent ? <code>{respondent.slice(0, 8)}…</code> : "none yet (created when a flow starts)"}
        {respondent && <button className="link" onClick={onNewRespondent}> · new respondent</button>}
      </p>
      <div className="grid">
        {modules.map((m, i) => {
          const done = attempts[m.id] ?? {};
          return (
            <div key={m.id} className="card">
              <span className="icon">{m.icon}</span>
              <strong>Module {i + 1}: {m.title}</strong>
              <span className="muted">{m.blurb}</span>
              <button className="journey" onClick={() => onJourney(m.id)}>▶ Start full flow</button>
              <details className="phases">
                <summary className="muted">Individual surveys (testing)</summary>
                {Object.entries(phases).map(([key, p]) => (
                  <button key={key} className={done[key] ? "phase done" : "phase"} onClick={() => onPick(m.id, key)}>
                    <span>{p.label} {p.form && <small>(Form {p.form})</small>}</span>
                    {done[key] && <span className="badge">{p.kind === "feedback" ? "✓ sent" : `${done[key].correct}/${done[key].total}`}</span>}
                  </button>
                ))}
              </details>
            </div>
          );
        })}
      </div>
    </section>
  );
}

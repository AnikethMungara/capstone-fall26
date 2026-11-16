export default function ModuleSelect({ modules, phases, attempts, onPick }) {
  return (
    <section>
      <h1>Choose a module</h1>
      <p className="muted">
        Take the pre-survey, play the module (in the real game), then take the post-survey.
        Each stage uses a different form of the questions.
      </p>
      <div className="grid">
        {modules.map((m, i) => {
          const done = attempts[m.id] ?? {};
          return (
            <div key={m.id} className="card">
              <span className="icon">{m.icon}</span>
              <strong>Module {i + 1}: {m.title}</strong>
              <span className="muted">{m.blurb}</span>
              <div className="phases">
                {Object.entries(phases).map(([key, p]) => (
                  <button key={key} className={done[key] ? "phase done" : "phase"} onClick={() => onPick(m.id, key)}>
                    <span>{p.label} <small>(Form {p.form})</small></span>
                    {done[key] && <span className="badge">{done[key].correct}/{done[key].total}</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

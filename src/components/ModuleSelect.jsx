function ModuleIcon({ moduleId }) {
  const iconPaths = {
    m1: (
      <>
        <rect x="3" y="6" width="18" height="14" rx="2.5" />
        <path d="M3 9V6a2 2 0 0 1 2-2h13" />
        <path d="M16 12h5v5h-5a2.5 2.5 0 0 1 0-5Z" />
        <circle cx="16.8" cy="14.5" r="0.75" fill="currentColor" stroke="none" />
      </>
    ),
    m2: (
      <>
        <path d="M3 20h18" />
        <path d="M4 17l6-6 4 3 6-8" />
        <path d="M15.5 6H20v4.5" />
      </>
    ),
    m3: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M2.5 10h19" />
        <path d="M7 15h4" />
      </>
    ),
    m4: (
      <>
        <path d="M12 3 3 8h18L12 3Z" />
        <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
        <path d="M3 21h18M4 18h16" />
      </>
    ),
  };

  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", color: "var(--accent, #a57ae8)" }}
      aria-hidden="true"
      focusable="false"
    >
      {iconPaths[moduleId] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

export default function ModuleSelect({ modules, phases, attempts, respondent, onPick, onJourney, onNewRespondent, onDashboard }) {
  return (
    <section className="module-screen">
      <div className="module-hero">
        <div className="eyebrow">FINANCIAL LEARNING · SURVEY EXPERIENCE</div>
        <h1>Choose a module</h1>
        <p>Explore the complete survey experience, from a learner's first response to their final feedback.</p>
        <div className="flow-steps" aria-label="Survey flow">
          <span className="flow-step"><b>01</b> Before survey</span>
          <span className="flow-arrow" aria-hidden="true">→</span>
          <span className="flow-step"><b>02</b> Knowledge quiz</span>
          <span className="flow-arrow" aria-hidden="true">→</span>
          <span className="flow-step"><b>03</b> After survey</span>
          <span className="flow-arrow" aria-hidden="true">→</span>
          <span className="flow-step"><b>04</b> Results + feedback</span>
        </div>
      </div>

      <div className="module-section-heading">
        <div>
          <div className="eyebrow">LEARNING MODULES</div>
          <h2>Explore the experience</h2>
          <p className="muted">Select a module to try the full journey, or open an individual survey for testing.</p>
        </div>
        <button className="dashboard-link" onClick={onDashboard}>Results dashboard →</button>
      </div>

      <div className="grid">
        {modules.map((m, i) => {
          const done = attempts[m.id] ?? {};
          return (
            <article key={m.id} className="card module-card">
              <div className="card-topline">
                <span className="icon" aria-hidden="true"><ModuleIcon moduleId={m.id} /></span>
                <span className="module-number">MODULE {String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3>Module {i + 1}: {m.title}</h3>
              <p className="muted module-blurb">{m.blurb}</p>
              <button className="journey" onClick={() => onJourney(m.id)}>Start full flow <span aria-hidden="true">→</span></button>
              <details className="phases">
                <summary>Individual surveys (testing)</summary>
                <div className="phase-list">
                  {Object.entries(phases).map(([key, p]) => (
                    <button key={key} className={done[key] ? "phase done" : "phase"} onClick={() => onPick(m.id, key)}>
                      <span>{p.label} {p.form && <small>(Form {p.form})</small>}</span>
                      {done[key] && <span className="badge">{p.kind === "feedback" ? "✓ sent" : `${done[key].correct}/${done[key].total}`}</span>}
                    </button>
                  ))}
                </div>
              </details>
            </article>
          );
        })}
      </div>

      <div className="respondent-bar">
        <div><span className="status-indicator" aria-hidden="true" /> <strong>Session</strong><span className="muted"> · Responses share a respondent ID throughout a flow.</span></div>
        <div className="respondent">
          {respondent ? <>Respondent: <code>{respondent.slice(0, 8)}…</code> <button className="link" onClick={onNewRespondent}>new respondent</button></> : <span className="muted">ID created when a flow starts</span>}
        </div>
      </div>
    </section>
  );
}

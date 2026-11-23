import "./Completion.css";

const stages = ["Before survey", "Knowledge quiz", "After survey", "Feedback"];

// Shown only after feedback is finished in the full survey flow.
export default function Completion({ module, onDone }) {
  return (
    <section className="completion-screen" aria-labelledby="completion-heading">
      <div className="completion-card">
        <div className="completion-check" aria-hidden="true">✓</div>
        <p className="eyebrow completion-eyebrow">ALL STAGES COMPLETE</p>
        <h1 id="completion-heading">Survey Complete!</h1>
        <p className="completion-subtitle">
          Thank you for completing <strong>{module.title}</strong>. Your responses have been recorded.
        </p>

        <div className="completion-details">
          <div className="completion-detail-row">
            <span>Module</span>
            <strong>{module.title}</strong>
          </div>
          <div className="completion-detail-row">
            <span>Progress</span>
            <strong>4 of 4 stages completed</strong>
          </div>
        </div>

        <div className="completion-stages" aria-label="Completed stages">
          {stages.map((stage) => (
            <div className="completion-stage" key={stage}>
              <span className="completion-stage-check" aria-hidden="true">✓</span>
              <span>{stage}</span>
            </div>
          ))}
        </div>

        <button className="completion-return" onClick={onDone}>
          Return to Modules <span aria-hidden="true">→</span>
        </button>
        <p className="completion-note">
          Responses are saved in this browser. Server delivery depends on whether the survey server is available.
        </p>
      </div>
    </section>
  );
}

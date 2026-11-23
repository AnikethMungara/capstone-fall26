import { MAX_TEXT, RATING_MIN, RATING_MAX } from "../data/feedback.js";

// The type switch: maps a question's `type` to the component that renders it.
// Unknown types show a message and log an error instead of crashing.
function Options({ q, response, onAnswer }) {
  const multi = q.type === "multi";
  const selected = (i) => (multi ? response?.includes(i) : response === i);
  const toggle = (i) => {
    if (!multi) return onAnswer(i);
    const cur = response ?? [];
    onAnswer(cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]);
  };
  return (
    <div className="options">
      {q.options.map((o, i) => (
        <button key={i} className={selected(i) ? "option selected" : "option"} onClick={() => toggle(i)}>
          <span className="mark">{multi ? (selected(i) ? "☑" : "☐") : selected(i) ? "●" : "○"}</span>{o}
        </button>
      ))}
    </div>
  );
}
function RatingScale({ value, labels, onChange }) {
  const values = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => RATING_MIN + i);
  return (
    <div>
      <div className="scale">
        {values.map((n) => (
          <button key={n} className={value === n ? "dot selected" : "dot"} onClick={() => onChange(n)}>{n}</button>
        ))}
      </div>
      <div className="row muted"><span>{labels[0]}</span><span>{labels[1]}</span></div>
    </div>
  );
}
function FreeText({ value, placeholder, onChange }) {
  return (
    <>
      <textarea className="freetext" rows={5} maxLength={MAX_TEXT} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_TEXT))} />
      <div className="counter muted">{value.length}/{MAX_TEXT}</div>
    </>
  );
}
function TagText({ q, response, onAnswer }) {
  const v = response ?? { tags: [], text: "" };
  const toggle = (tag) =>
    onAnswer({ ...v, tags: v.tags.includes(tag) ? v.tags.filter((x) => x !== tag) : [...v.tags, tag] });
  return (
    <div>
      <p className="muted">Select at least one tag or write a comment.</p>
      <div className="tags">
        {q.tags.map((tag) => (
          <button key={tag} className={v.tags.includes(tag) ? "tag-chip on" : "tag-chip"} onClick={() => toggle(tag)}>{tag}</button>
        ))}
      </div>
      <FreeText value={v.text} placeholder={q.placeholder} onChange={(text) => onAnswer({ ...v, text })} />
    </div>
  );
}
function RatingText({ q, response, onAnswer }) {
  const v = response ?? { rating: null, text: "" };
  return (
    <div>
      <p className="muted">Select a rating. Comment optional.</p>
      <RatingScale value={v.rating} labels={q.scaleLabels}
        onChange={(n) => onAnswer({ ...v, rating: Math.min(RATING_MAX, Math.max(RATING_MIN, n)) })} />
      <FreeText value={v.text} placeholder={q.placeholder} onChange={(text) => onAnswer({ ...v, text })} />
    </div>
  );
}
const renderers = {
  single: (p) => <Options {...p} />,
  multi: (p) => <><p className="muted">Select all that apply.</p><Options {...p} /></>,
  scale: ({ q, response, onAnswer }) => <RatingScale value={response} labels={q.scaleLabels} onChange={onAnswer} />,
  tagtext: (p) => <TagText {...p} />,
  ratingtext: (p) => <RatingText {...p} />,
};

export const optionalTypes = ["tagtext", "ratingtext"];
export default function QuestionBody(props) {
  const render = renderers[props.q.type];
  if (!render) {
    console.error(`[QuestionBody] unknown question type "${props.q.type}" (${props.q.id})`);
    return <p className="feedback bad">This question can’t be shown (unknown type “{props.q.type}”).</p>;
  }
  return render(props);
}

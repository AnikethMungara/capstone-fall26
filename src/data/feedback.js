// Qualitative feedback survey. Each prompt pairs THEME TAGS (quick, codable)
// with optional FREE TEXT (the "why"). Tags make the text analysable without
// hand-coding every response. Draft wording: review with the team / Product Owner.

export const MAX_TEXT = 500;

export const feedbackPrompts = [
  {
    id: "confusing", type: "tagtext",
    text: "What was the most confusing part of this module?",
    tags: ["Concepts", "Wording", "Math", "Pacing", "Navigation", "Nothing"],
    placeholder: "Tell us what was unclear…",
  },
  {
    id: "stuck", type: "tagtext",
    text: "Was there a moment you felt stuck, frustrated or lost?",
    tags: ["Frustrated", "Lost", "Bored", "Overwhelmed", "Never stuck"],
    placeholder: "What was happening?",
  },
  {
    id: "learned", type: "tagtext",
    text: "What did you take away that you didn’t know before?",
    tags: ["Budgeting", "Interest", "Credit", "Net worth", "Debt payoff", "Nothing new"],
    placeholder: "In your own words…",
  },
  {
    id: "decision", type: "tagtext",
    text: "Describe a money decision you would make differently now.",
    tags: ["Saving", "Spending", "Borrowing", "Investing", "None"],
    placeholder: "What would you do, and why?",
  },
  {
    id: "change", type: "tagtext",
    text: "What would you change or add to the experience?",
    tags: ["Content", "Visuals", "Length", "Difficulty", "Feedback/hints", "Nothing"],
    placeholder: "Your suggestion…",
  },
];

export function getFeedbackQuestions(module) {
  return feedbackPrompts.map((p) => ({ ...p, id: `${module.id}.feedback.${p.id}`, conceptId: p.id }));
}

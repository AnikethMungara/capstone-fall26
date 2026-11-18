// Before-quiz and after-quiz SURVEYS: the same self-report confidence items asked
// twice, so each respondent's change can be measured (#75, #76, #85).
// Item ids are identical before and after; only `surveyType` differs.
// Draft wording: replace with the approved sprint 4 question set.

const AGREE = ["Strongly disagree", "Strongly agree"];

const items = {
  m1: [
    { id: "budget", short: "Budgeting", text: "I feel confident creating and sticking to a monthly budget." },
    { id: "balance", short: "Surplus/deficit", text: "I can tell whether I’m running a surplus or a deficit." },
    { id: "emergency", short: "Surprises", text: "I’d know how to handle a surprise expense." },
    { id: "overall", short: "Overall", text: "Overall, I feel confident managing my money day to day." },
  ],
  m2: [
    { id: "compound", short: "Compounding", text: "I can explain compound interest to someone else." },
    { id: "early", short: "Starting early", text: "I understand why starting to save early matters." },
    { id: "rates", short: "Comparing rates", text: "I can compare what a savings rate and a loan rate cost me." },
    { id: "overall", short: "Overall", text: "Overall, I feel confident managing my money day to day." },
  ],
  m3: [
    { id: "minimum", short: "Min. payments", text: "I understand how minimum payments affect what I owe." },
    { id: "score", short: "Credit score", text: "I know what affects my credit score." },
    { id: "ask", short: "Card questions", text: "I know what to ask before opening a credit card." },
    { id: "overall", short: "Overall", text: "Overall, I feel confident managing my money day to day." },
  ],
  m4: [
    { id: "networth", short: "Net worth", text: "I can calculate my net worth." },
    { id: "assets", short: "Assets/liabilities", text: "I know the difference between an asset and a liability." },
    { id: "payoff", short: "Debt payoff", text: "I could pick a plan to pay down debt." },
    { id: "overall", short: "Overall", text: "Overall, I feel confident managing my money day to day." },
  ],
};

export const surveyLabels = {
  before: "Before-quiz survey",
  quiz: "Quiz",
  after: "After-quiz survey",
  feedback: "Feedback",
  pre: "Pre-survey",
  post: "Post-survey",
  followup: "Follow-up",
};

export const journeyStages = ["before", "quiz", "after", "feedback"];

// Same question ids for before and after so the two can be paired.
export function getSurveyItems(module) {
  return items[module.id].map((i) => ({
    id: `${module.id}.${i.id}`,
    conceptId: i.id,
    short: i.short,
    type: "scale",
    text: i.text,
    scaleLabels: AGREE,
  }));
}

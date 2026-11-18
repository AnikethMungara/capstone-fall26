// Turns the shell's record into one flat CSV row.
//   scale/single answer -> `answer` (number)
//   multi-select        -> `answer` as "0;2;3"
//   feedback tag+text   -> `tags` ("Pacing;Wording") and `text`
//   feedback rating     -> `rating` (+ `text`)
// so the file is analysis-ready without parsing JSON out of a cell.

export const COLUMNS = [
  "respondentId", "surveyType", "moduleId", "questionId", "conceptId",
  "answer", "rating", "tags", "text", "timestamp", "receivedAt",
];

const KEY_FIELDS = ["respondentId", "surveyType", "moduleId", "questionId"];

export const rowKey = (row) => JSON.stringify(KEY_FIELDS.map((f) => row[f]));

export function validate(rec) {
  if (!rec || typeof rec !== "object" || Array.isArray(rec)) return "record must be an object";
  for (const f of KEY_FIELDS) {
    if (typeof rec[f] !== "string" || !rec[f].trim()) return `${f} is required`;
    if (rec[f].length > 200) return `${f} is too long`;
  }
  if (rec.answer === undefined || rec.answer === null) return "answer is required";
  return null;
}

export function flatten(rec, receivedAt = new Date().toISOString()) {
  const a = rec.answer;
  let answer = "", rating = "", tags = "", text = "";
  if (Array.isArray(a)) answer = a.join(";");
  else if (a && typeof a === "object") {
    rating = a.rating ?? "";
    tags = Array.isArray(a.tags) ? a.tags.join(";") : "";
    text = a.text ?? "";
  } else answer = a;
  const row = {
    respondentId: rec.respondentId, surveyType: rec.surveyType, moduleId: rec.moduleId,
    questionId: rec.questionId, conceptId: rec.conceptId ?? "",
    answer, rating, tags, text, timestamp: rec.timestamp ?? "", receivedAt,
  };
  return Object.fromEntries(COLUMNS.map((c) => [c, String(row[c] ?? "")]));
}

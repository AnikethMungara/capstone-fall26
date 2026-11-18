// One flat record per answer (#80):
//   respondentId, surveyType, moduleId, questionId, conceptId, answer, timestamp
// Records are upserted by (respondentId, surveyType, moduleId, questionId), so
// changing an answer or refreshing never creates duplicates. Persisted to
// localStorage as each answer is given (#75).

const KEY = "mm_records";

export function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

const same = (a, b) =>
  a.respondentId === b.respondentId && a.surveyType === b.surveyType &&
  a.moduleId === b.moduleId && a.questionId === b.questionId;

export function saveAnswer({ respondentId, surveyType, moduleId, questionId, conceptId, answer }) {
  const rec = { respondentId, surveyType, moduleId, questionId, conceptId, answer, timestamp: new Date().toISOString() };
  const all = getRecords();
  const i = all.findIndex((r) => same(r, rec));
  if (i >= 0) all[i] = rec;
  else all.push(rec);
  localStorage.setItem(KEY, JSON.stringify(all));
  return rec;
}

export function getAnswersFor(respondentId, surveyType, moduleId) {
  const out = {};
  for (const r of getRecords()) {
    if (r.respondentId === respondentId && r.surveyType === surveyType && r.moduleId === moduleId) {
      out[r.questionId] = r.answer;
    }
  }
  return out;
}

export function clearRecords() {
  localStorage.removeItem(KEY);
}

const FIELDS = ["respondentId", "surveyType", "moduleId", "questionId", "conceptId", "answer", "timestamp"];
const cell = (v) => `"${(typeof v === "string" ? v : JSON.stringify(v ?? "")).replace(/"/g, '""')}"`;

export const toCSV = (records) =>
  [FIELDS.join(","), ...records.map((r) => FIELDS.map((f) => cell(r[f])).join(","))].join("\n");

export function downloadFile(name, text, mime) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = name;
  a.click();
}

// Sends a survey's records to a backend when VITE_SUBMIT_URL is set; otherwise
// they simply stay in localStorage (the interim CSV/JSON export source).
export async function submitRecords(records) {
  const url = import.meta.env.VITE_SUBMIT_URL;
  if (!url) return { ok: true, local: true };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(records),
  });
  return { ok: res.ok, local: false };
}

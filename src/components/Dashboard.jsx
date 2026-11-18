import { useMemo, useState } from "react";
import BarChart from "./BarChart.jsx";
import { getSurveyItems } from "../data/surveys.js";
import { getRecords, toCSV, downloadFile } from "../records.js";

// Synthetic respondents so the charts can be reviewed before real data exists.
function demoRecords(module, count = 30) {
  const items = getSurveyItems(module);
  const out = [];
  const clamp = (v) => Math.min(5, Math.max(1, Math.round(v)));
  for (let r = 0; r < count; r++) {
    const base = 1.5 + Math.random() * 2.5;
    const gain = Math.random() * 2 - 0.3;
    for (const it of items) {
      for (const [surveyType, val] of [["before", base + Math.random()], ["after", base + gain + Math.random()]]) {
        out.push({ respondentId: `demo-${r}`, surveyType, moduleId: module.id, questionId: it.id,
          conceptId: it.conceptId, answer: clamp(val), timestamp: new Date().toISOString() });
      }
    }
  }
  return out;
}

function pairedRespondents(records, moduleId) {
  const by = {};
  for (const r of records) {
    if (r.moduleId !== moduleId || !["before", "after"].includes(r.surveyType) || typeof r.answer !== "number") continue;
    (by[r.respondentId] ??= { before: {}, after: {} })[r.surveyType][r.conceptId] = r.answer;
  }
  return Object.values(by).filter((v) => Object.keys(v.before).length && Object.keys(v.after).length);
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

export default function Dashboard({ modules, onBack }) {
  const [moduleId, setModuleId] = useState(modules[0].id);
  const [demo, setDemo] = useState(false);
  const mod = modules.find((m) => m.id === moduleId);
  const records = useMemo(() => (demo ? demoRecords(mod) : getRecords()), [demo, mod]);
  const people = pairedRespondents(records, moduleId);
  const items = getSurveyItems(mod);

  // Chart 1: average confidence per item, before vs after.
  const groups = items.map((it) => {
    const b = people.map((p) => p.before[it.conceptId]).filter((v) => v != null);
    const a = people.map((p) => p.after[it.conceptId]).filter((v) => v != null);
    return { label: it.short, values: [b.length ? mean(b) : 0, a.length ? mean(a) : 0] };
  });

  // Chart 2: how many respondents improved, stayed the same, or declined overall.
  const buckets = { Declined: 0, "No change": 0, Improved: 0 };
  for (const p of people) {
    const ids = Object.keys(p.before).filter((k) => k in p.after);
    if (!ids.length) continue;
    const d = mean(ids.map((k) => p.after[k] - p.before[k]));
    buckets[d > 0.25 ? "Improved" : d < -0.25 ? "Declined" : "No change"]++;
  }

  const all = demo ? records : getRecords();
  return (
    <section>
      <div className="row">
        <button className="link" onClick={onBack}>← Modules</button>
        <span className="muted">{all.length} records{demo && " · DEMO DATA"}</span>
      </div>
      <h1>Before vs after</h1>

      <div className="toolbar">
        <select value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
          {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
        <label><input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} /> Demo data (30 fake respondents)</label>
        <button onClick={() => downloadFile("mentamorph-records.csv", toCSV(getRecords()), "text/csv")}>Download CSV</button>
        <button onClick={() => downloadFile("mentamorph-records.json", JSON.stringify(getRecords(), null, 2), "application/json")}>Download JSON</button>
      </div>

      {people.length === 0 ? (
        <p className="muted">No respondent has finished both the before and after surveys for this module yet. Run the full flow, or tick demo data.</p>
      ) : (
        <>
          <BarChart title="Average confidence by topic" xLabel="Topic" yLabel="Mean rating (1–5)"
            groups={groups} series={["Before", "After"]} yMax={5} n={people.length} />
          <BarChart title="Change in confidence per respondent" xLabel="Overall change" yLabel="Respondents"
            groups={Object.entries(buckets).map(([label, v]) => ({ label, values: [v] }))}
            series={["Respondents"]} yMax={Math.max(5, ...Object.values(buckets))} n={people.length}
            step={Math.max(1, Math.ceil(Math.max(5, ...Object.values(buckets)) / 5))} />
        </>
      )}
    </section>
  );
}

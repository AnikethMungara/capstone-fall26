# MentaMorph Survey Prototype

React shell showing the survey experience planned for the MentaMorph Unity game.
Not the real game UI: a visual/interaction reference.

## Run
Requires Node 18+.

    npm install
    npm run dev        # http://localhost:5173
    npm run build      # static bundle in dist/ (relative paths)

## Structure
- `src/data/modules.js`: all questions, grouped by concept. Each concept has three parallel forms:
  **A = pre-survey, B = post-survey, C = follow-up**. Form A mostly comes from
  *MentaMorph Modules Questions.docx*; B and C were drafted here and need review.
  Types: `single`, `multi`, `scale` (ungraded confidence rating).
- `src/scoring.js`: grading and per-attempt results.
- `src/components/`: ModuleSelect, Question (answer, feedback, progress), Results.
- `src/bridge/unityBridge.js`: the only file that knows about Unity.

## Unity integration (later)
React -> Unity: events `survey_started`, `answer`, `survey_completed` (each carries `moduleId`, `phase`, `form`) are sent via
`unityInstance.SendMessage("SurveyManager", "OnSurveyEvent", json)`. Add a `SurveyManager`
GameObject with an `OnSurveyEvent(string json)` method.

Unity -> React: `window.MentaMorphSurvey.start("m2", "pre")` opens a module survey (`pre`, `post` or `followup`); `.reset()` returns to the menu.

Ways to host it: embed the `dist/` build in a Unity WebGL template, or a WebView plugin on mobile/desktop.

## Full flow (sprint 5)
Before-quiz survey -> quiz -> after-quiz survey -> results -> feedback, all under one respondent ID.
- `src/respondent.js`: anonymous UUID in localStorage, kept until the flow finishes (#96).
- `src/records.js`: one record per answer (`respondentId, surveyType, moduleId, questionId, conceptId, answer, timestamp`),
  upserted so there are no duplicates, saved as each answer is given, exportable as CSV/JSON. Set `VITE_SUBMIT_URL` to POST
  each submitted survey to a backend (#80).
- `src/data/surveys.js`: before/after confidence items (same ids both times so they can be paired).
- `src/components/Dashboard.jsx`: before-vs-after charts (n shown, "indicative" under 30); tick *Demo data* to preview.
- `docs/gap-list.md`: draft gap list for #78/#98.

## Tests
    npm test            # 124 tests, Vitest + Testing Library (jsdom)
Covers data integrity, scoring, records/respondent ID/export, every question component, the 30-render
type-switch check, the full before -> quiz -> after -> feedback flow (10 runs), after-quiz submit edge cases,
Unity entry points and the dashboard charts. Layout at real mobile widths is CSS and is not covered; check it by eye.

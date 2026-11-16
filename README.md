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

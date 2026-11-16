// Single place where the React UI talks to the game.
//
// React -> Unity: sendToUnity(event, payload)
//   Calls unityInstance.SendMessage("SurveyManager", "OnSurveyEvent", json)
//   when running inside a Unity WebGL page. Outside Unity it just logs, so
//   the shell works standalone in a browser.
//
// Unity -> React: window.MentaMorphSurvey.start(moduleId) / .reset()
//   (registered in App.jsx) so the game can open a module on demand.

const UNITY_OBJECT = "SurveyManager";
const UNITY_METHOD = "OnSurveyEvent";

export function sendToUnity(event, payload = {}) {
  const message = JSON.stringify({ event, payload, ts: Date.now() });

  if (typeof window !== "undefined" && window.unityInstance?.SendMessage) {
    window.unityInstance.SendMessage(UNITY_OBJECT, UNITY_METHOD, message);
  } else {
    console.info("[unityBridge]", event, payload);
  }

  // Also a DOM event, handy for tests or a host page that isn't Unity.
  window.dispatchEvent(new CustomEvent("mentamorph:survey", { detail: { event, payload } }));
}

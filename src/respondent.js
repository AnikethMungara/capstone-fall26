// Anonymous respondent ID shared by the before, quiz, after and feedback
// surveys so one student's answers can be joined (#96). Created on first use,
// kept in localStorage so a refresh mid-flow keeps the same ID, and cleared
// when the full flow finishes.

const KEY = "mm_respondent_id";

const makeId = () =>
  crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const peekRespondentId = () => localStorage.getItem(KEY);

export function getRespondentId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = makeId();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export const clearRespondent = () => localStorage.removeItem(KEY);

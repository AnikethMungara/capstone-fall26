export const isGraded = (q) => !["scale", "tagtext", "ratingtext"].includes(q.type);

export function isCorrect(q, value) {
  if (value === undefined) return false;
  if (q.type === "multi") {
    return value.length === q.answer.length && q.answer.every((i) => value.includes(i));
  }
  return value === q.answer;
}

// Returns { correct, total, scaleAvg, items: [{question, response, correct}] }
export function scoreAttempt(questions, answers) {
  const items = questions.map((q) => ({
    question: q,
    response: answers[q.id],
    correct: isGraded(q) ? isCorrect(q, answers[q.id]) : null,
  }));
  const graded = items.filter((i) => i.correct !== null);
  const scales = items.filter((i) => i.question.type === "scale" && i.response !== undefined);
  return {
    correct: graded.filter((i) => i.correct).length,
    total: graded.length,
    scaleAvg: scales.length ? scales.reduce((a, i) => a + i.response, 0) / scales.length : null,
    items,
  };
}

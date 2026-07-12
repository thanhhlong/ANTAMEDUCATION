// Server-side exam grading — mirrors the scoring logic previously run in the browser
// (src/components/Student.tsx ExamPage.submitExam), but now trusted only when computed
// here, since a client could otherwise submit a fabricated score directly.

export function norm(s = ''): string {
  return s.toString().trim().toLowerCase().replace(/\s+/g, ' ')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}

export interface GradableQuestion {
  id: string;
  type: 'mcq' | 'short' | 'essay';
  content: string;
  correct?: number | null;
  sampleAnswer?: string | null;
  keywords: string[];
}

export interface ExamDetail {
  qid: string;
  type: string;
  content: string;
  given: unknown;
  score: number;
}

export function gradeExam(questions: GradableQuestion[], answers: Record<string, unknown>) {
  let totalScore = 0;
  const details: ExamDetail[] = questions.map(q => {
    let score = 0;
    const given = answers[q.id];

    if (q.type === 'mcq') {
      score = given === q.correct ? 1 : 0;
    } else if (q.type === 'short') {
      score = given && norm(String(given)) === norm(q.sampleAnswer || '') ? 1 : 0;
    } else if (q.type === 'essay') {
      const text = norm(given ? String(given) : '');
      const matched = (q.keywords || []).filter(k => text.includes(norm(k)));
      score = q.keywords && q.keywords.length > 0 ? +(matched.length / q.keywords.length).toFixed(2) : 0;
    }

    totalScore += score;
    return { qid: q.id, type: q.type, content: q.content, given, score };
  });

  totalScore = Math.round(totalScore * 10) / 10;
  return { score: totalScore, total: 10, passed: totalScore >= 8, details };
}

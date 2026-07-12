import { Router } from 'express';
import { prisma } from '../_lib/prisma.js';
import { requireAuth } from '../_lib/auth.js';
import { tierForOrder } from '../_lib/levels.js';

export const leaderboardRouter = Router();

leaderboardRouter.use(requireAuth);

// Returns pre-aggregated standings (points/activity/medals) per student — never raw
// attempt details, so students can't see each other's individual answers/questions.
leaderboardRouter.get('/', async (_req, res) => {
  const [students, attempts, lessons] = await Promise.all([
    prisma.user.findMany({ where: { role: 'student' } }),
    prisma.attempt.findMany(),
    prisma.lesson.findMany(),
  ]);

  const lessonById = new Map(lessons.map(l => [l.id, l]));

  const board = students.map(student => {
    const mine = attempts.filter(a => a.userId === student.id);

    const bestByLessonLevel = new Map<string, number>();
    mine.forEach(a => {
      const key = `${a.lessonId}|${a.level}`;
      bestByLessonLevel.set(key, Math.max(bestByLessonLevel.get(key) ?? 0, a.score));
    });
    const points = Array.from(bestByLessonLevel.values()).reduce((s, v) => s + v, 0);

    const bySubject = new Map<string, number>(); // subject -> highest fully-passed lesson order
    mine.filter(a => a.passed && a.level === 3).forEach(a => {
      const lesson = lessonById.get(a.lessonId);
      if (!lesson) return;
      bySubject.set(lesson.subject, Math.max(bySubject.get(lesson.subject) ?? 0, lesson.order));
    });
    const medals = Array.from(bySubject.entries())
      .map(([subject, order]) => ({ subject, order, medal: tierForOrder(order).medal }))
      .filter(m => m.medal);

    return {
      user: { id: student.id, name: student.name, grade: student.grade ?? undefined },
      points: Math.round(points * 10) / 10,
      activity: mine.length,
      medals,
    };
  });

  board.sort((a, b) => b.points - a.points || b.activity - a.activity);
  res.json(board);
});

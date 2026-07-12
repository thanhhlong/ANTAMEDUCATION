import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../_lib/prisma.js';
import { requireAuth, type AuthedRequest } from '../_lib/auth.js';
import { gradeExam } from '../_lib/grading.js';
import { tierForOrder, MAX_SUB_LEVEL } from '../_lib/levels.js';

export const attemptsRouter = Router();

attemptsRouter.use(requireAuth);

// Students list only their own attempts; admins can pass ?userId= to inspect anyone's.
attemptsRouter.get('/', async (req: AuthedRequest, res) => {
  const targetUserId = req.auth!.role === 'admin' && req.query.userId ? String(req.query.userId) : req.auth!.sub;
  const attempts = await prisma.attempt.findMany({ where: { userId: targetUserId }, orderBy: { date: 'desc' } });
  res.json(attempts);
});

// Submits raw answers for a lesson sub-level; the server fetches the real questions
// (with correct answers) and grades — the client never controls the resulting score.
attemptsRouter.post('/', async (req: AuthedRequest, res) => {
  const { lessonId, level, answers } = req.body ?? {};
  if (!lessonId || !level) {
    res.status(400).json({ error: 'Thiếu bài học hoặc cấp độ.' });
    return;
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: String(lessonId) } });
  if (!lesson) {
    res.status(404).json({ error: 'Không tìm thấy bài học.' });
    return;
  }

  const questions = await prisma.question.findMany({ where: { lessonId: lesson.id, level: Number(level) } });
  if (questions.length === 0) {
    res.status(400).json({ error: 'Chưa có câu hỏi cho cấp độ này.' });
    return;
  }

  const graded = gradeExam(questions, answers ?? {});
  const userId = req.auth!.sub;

  const wasLessonAlreadyDone = await prisma.attempt.findFirst({
    where: { userId, lessonId: lesson.id, level: MAX_SUB_LEVEL, passed: true },
  });

  const attempt = await prisma.attempt.create({
    data: {
      userId,
      subject: lesson.subject,
      grade: lesson.grade,
      lessonId: lesson.id,
      level: Number(level),
      score: graded.score,
      total: graded.total,
      passed: graded.passed,
      details: graded.details as unknown as Prisma.InputJsonValue,
    },
  });

  let certificate = null;
  if (graded.passed && Number(level) === MAX_SUB_LEVEL && !wasLessonAlreadyDone) {
    const tier = tierForOrder(lesson.order);
    const medal = tier.medal ? await prisma.medal.findUnique({ where: { name: tier.medal } }) : null;
    certificate = await prisma.certificate.create({
      data: {
        userId,
        subject: lesson.subject,
        grade: lesson.grade,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        medalId: medal?.id ?? null,
      },
      include: { medal: true },
    });
  }

  res.status(201).json({ attempt, certificate });
});

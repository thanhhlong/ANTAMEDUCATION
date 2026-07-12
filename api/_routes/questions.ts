import { Router } from 'express';
import { prisma } from '../_lib/prisma.js';
import { requireAuth, requireRole, type AuthedRequest } from '../_lib/auth.js';

export const questionsRouter = Router();

questionsRouter.use(requireAuth);

// Non-admins (students taking an exam, teachers) never receive answer fields —
// grading always happens server-side in POST /api/attempts.
function stripAnswers(q: Record<string, unknown>) {
  const { correct, sampleAnswer, keywords, ...rest } = q;
  return rest;
}

questionsRouter.get('/', async (req: AuthedRequest, res) => {
  const { lessonId, level } = req.query;
  const where: Record<string, unknown> = {};
  if (lessonId) where.lessonId = String(lessonId);
  if (level) where.level = Number(level);

  const questions = await prisma.question.findMany({ where });
  const isAdmin = req.auth?.role === 'admin';
  res.json(isAdmin ? questions : questions.map(stripAnswers));
});

questionsRouter.post('/', requireRole('admin'), async (req, res) => {
  const { subject, grade, lessonId, level, type, content, options, correct, sampleAnswer, keywords } = req.body ?? {};
  if (!subject || !grade || !lessonId || !level || !type || !content) {
    res.status(400).json({ error: 'Thiếu thông tin câu hỏi.' });
    return;
  }
  const question = await prisma.question.create({
    data: {
      subject, grade: Number(grade), lessonId, level: Number(level), type, content,
      options: options ?? [],
      correct: correct !== undefined ? Number(correct) : null,
      sampleAnswer: sampleAnswer ?? null,
      keywords: keywords ?? [],
    },
  });
  res.status(201).json(question);
});

questionsRouter.put('/:id', requireRole('admin'), async (req, res) => {
  const { subject, grade, lessonId, level, type, content, options, correct, sampleAnswer, keywords } = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (subject !== undefined) data.subject = subject;
  if (grade !== undefined) data.grade = Number(grade);
  if (lessonId !== undefined) data.lessonId = lessonId;
  if (level !== undefined) data.level = Number(level);
  if (type !== undefined) data.type = type;
  if (content !== undefined) data.content = content;
  if (options !== undefined) data.options = options;
  if (correct !== undefined) data.correct = correct === null ? null : Number(correct);
  if (sampleAnswer !== undefined) data.sampleAnswer = sampleAnswer;
  if (keywords !== undefined) data.keywords = keywords;

  try {
    const question = await prisma.question.update({ where: { id: req.params.id }, data });
    res.json(question);
  } catch {
    res.status(404).json({ error: 'Không tìm thấy câu hỏi.' });
  }
});

questionsRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await prisma.question.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Không tìm thấy câu hỏi.' });
  }
});

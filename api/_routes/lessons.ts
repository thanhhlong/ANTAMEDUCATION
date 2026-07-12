import { Router } from 'express';
import { prisma } from '../_lib/prisma.js';
import { requireAuth, requireRole } from '../_lib/auth.js';

export const lessonsRouter = Router();

lessonsRouter.use(requireAuth);

// All authenticated roles can read the lesson list; visibility filtering for
// students happens client-side (same logic as before), same as content/quiz hide.
lessonsRouter.get('/', async (_req, res) => {
  const lessons = await prisma.lesson.findMany({ orderBy: [{ subject: 'asc' }, { grade: 'asc' }, { order: 'asc' }] });
  res.json(lessons);
});

lessonsRouter.post('/', requireRole('admin'), async (req, res) => {
  const { subject, grade, order, title, desc, driveLink } = req.body ?? {};
  if (!subject || !grade || !order || !title || !driveLink) {
    res.status(400).json({ error: 'Thiếu thông tin bài học.' });
    return;
  }
  const lesson = await prisma.lesson.create({
    data: { subject, grade: Number(grade), order: Number(order), title, desc: desc ?? '', driveLink },
  });
  res.status(201).json(lesson);
});

lessonsRouter.put('/:id', requireRole('admin'), async (req, res) => {
  const { subject, grade, order, title, desc, driveLink, contentHidden, contentVisibleAt, quizHidden, quizVisibleAt } = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (subject !== undefined) data.subject = subject;
  if (grade !== undefined) data.grade = Number(grade);
  if (order !== undefined) data.order = Number(order);
  if (title !== undefined) data.title = title;
  if (desc !== undefined) data.desc = desc;
  if (driveLink !== undefined) data.driveLink = driveLink;
  if (contentHidden !== undefined) data.contentHidden = contentHidden;
  if (contentVisibleAt !== undefined) data.contentVisibleAt = contentVisibleAt ? new Date(contentVisibleAt) : null;
  if (quizHidden !== undefined) data.quizHidden = quizHidden;
  if (quizVisibleAt !== undefined) data.quizVisibleAt = quizVisibleAt ? new Date(quizVisibleAt) : null;

  try {
    const lesson = await prisma.lesson.update({ where: { id: req.params.id }, data });
    res.json(lesson);
  } catch {
    res.status(404).json({ error: 'Không tìm thấy bài học.' });
  }
});

lessonsRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await prisma.lesson.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Không tìm thấy bài học.' });
  }
});

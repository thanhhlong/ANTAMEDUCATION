import { Router } from 'express';
import { prisma } from '../_lib/prisma.js';
import { requireAuth, requireRole, type AuthedRequest } from '../_lib/auth.js';

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

documentsRouter.get('/', async (_req, res) => {
  const documents = await prisma.document.findMany({ orderBy: { uploadedAt: 'desc' } });
  res.json(documents);
});

documentsRouter.post('/', requireRole('teacher', 'admin'), async (req: AuthedRequest, res) => {
  const { subject, grade, title, content } = req.body ?? {};
  if (!subject || !grade || !title || !content) {
    res.status(400).json({ error: 'Thiếu thông tin tài liệu.' });
    return;
  }
  const document = await prisma.document.create({
    data: { teacherId: req.auth!.sub, subject, grade: Number(grade), title, content },
  });
  res.status(201).json(document);
});

documentsRouter.put('/:id', requireRole('teacher', 'admin'), async (req, res) => {
  const { subject, grade, title, content } = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (subject !== undefined) data.subject = subject;
  if (grade !== undefined) data.grade = Number(grade);
  if (title !== undefined) data.title = title;
  if (content !== undefined) data.content = content;
  try {
    const document = await prisma.document.update({ where: { id: req.params.id }, data });
    res.json(document);
  } catch {
    res.status(404).json({ error: 'Không tìm thấy tài liệu.' });
  }
});

documentsRouter.delete('/:id', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    await prisma.document.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Không tìm thấy tài liệu.' });
  }
});

import { Router } from 'express';
import { prisma } from '../_lib/prisma.js';
import { requireAuth, requireRole, type AuthedRequest } from '../_lib/auth.js';

export const postsRouter = Router();

postsRouter.use(requireAuth);

postsRouter.get('/', async (_req, res) => {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(posts);
});

postsRouter.post('/', async (req: AuthedRequest, res) => {
  const { title, content } = req.body ?? {};
  if (!title || !content) {
    res.status(400).json({ error: 'Thiếu tiêu đề hoặc nội dung.' });
    return;
  }
  const post = await prisma.post.create({
    data: { authorId: req.auth!.sub, title, content, status: 'pending', kind: 'community' },
  });
  res.status(201).json(post);
});

// Approve/reject/change kind — admin only.
postsRouter.put('/:id', requireRole('admin'), async (req, res) => {
  const { status, kind } = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (kind !== undefined) data.kind = kind;
  try {
    const post = await prisma.post.update({ where: { id: req.params.id }, data });
    res.json(post);
  } catch {
    res.status(404).json({ error: 'Không tìm thấy bài viết.' });
  }
});

postsRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Không tìm thấy bài viết.' });
  }
});

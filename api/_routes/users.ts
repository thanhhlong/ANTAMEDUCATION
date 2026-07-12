import { Router } from 'express';
import { prisma } from '../_lib/prisma.js';
import { hashPassword, requireAuth, requireRole } from '../_lib/auth.js';

export const usersRouter = Router();

function publicUser(u: { id: string; name: string; email: string; role: string; grade: number | null }) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, grade: u.grade ?? undefined };
}

// Admin-only account management (list/create/update/delete GV, HS, Admin).
usersRouter.use(requireAuth, requireRole('admin'));

usersRouter.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(users.map(publicUser));
});

usersRouter.post('/', async (req, res) => {
  const { name, email, password, role, grade } = req.body ?? {};
  if (!name || !email || !role) {
    res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
    return;
  }
  const normEmail = String(email).toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normEmail } });
  if (existing) {
    res.status(409).json({ error: 'Email đã tồn tại.' });
    return;
  }
  const passwordHash = await hashPassword(String(password || 'hs123456'));
  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normEmail,
      passwordHash,
      role,
      grade: role === 'student' && grade ? Number(grade) : null,
    },
  });
  res.status(201).json(publicUser(user));
});

usersRouter.put('/:id', async (req, res) => {
  const { name, email, password, role, grade } = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = String(name).trim();
  if (email !== undefined) data.email = String(email).toLowerCase().trim();
  if (role !== undefined) data.role = role;
  if (grade !== undefined) data.grade = grade ? Number(grade) : null;
  if (password) data.passwordHash = await hashPassword(String(password));

  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(publicUser(user));
  } catch {
    res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  }
});

usersRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  }
});

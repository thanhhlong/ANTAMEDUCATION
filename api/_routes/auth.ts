import { Router } from 'express';
import { prisma } from '../_lib/prisma.js';
import { hashPassword, verifyPassword, signToken, requireAuth, type AuthedRequest } from '../_lib/auth.js';

export const authRouter = Router();

function publicUser(u: { id: string; name: string; email: string; role: string; grade: number | null }) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, grade: u.grade ?? undefined };
}

authRouter.post('/register', async (req, res) => {
  const { name, email, password, grade } = req.body ?? {};
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Thiếu họ tên, email hoặc mật khẩu.' });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (existing) {
    res.status(409).json({ error: 'Email đã tồn tại.' });
    return;
  }
  const passwordHash = await hashPassword(String(password));
  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash,
      role: 'student',
      grade: grade ? Number(grade) : null,
    },
  });
  const token = signToken({ sub: user.id, role: user.role });
  res.status(201).json({ token, user: publicUser(user) });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Thiếu email hoặc mật khẩu.' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!user || !(await verifyPassword(String(password), user.passwordHash))) {
    res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    return;
  }
  const token = signToken({ sub: user.id, role: user.role });
  res.json({ token, user: publicUser(user) });
});

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) {
    res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    return;
  }
  res.json({ user: publicUser(user) });
});

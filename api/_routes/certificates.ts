import { Router } from 'express';
import { prisma } from '../_lib/prisma.js';
import { requireAuth, type AuthedRequest } from '../_lib/auth.js';

export const certificatesRouter = Router();

certificatesRouter.use(requireAuth);

certificatesRouter.get('/', async (req: AuthedRequest, res) => {
  const targetUserId = req.auth!.role === 'admin' && req.query.userId ? String(req.query.userId) : req.auth!.sub;
  const certificates = await prisma.certificate.findMany({
    where: { userId: targetUserId },
    include: { medal: true },
    orderBy: { date: 'desc' },
  });
  res.json(certificates.map(c => ({ ...c, medal: c.medal?.name ?? null })));
});

import express from 'express';
import { authRouter } from './_routes/auth.js';
import { usersRouter } from './_routes/users.js';
import { lessonsRouter } from './_routes/lessons.js';
import { questionsRouter } from './_routes/questions.js';
import { postsRouter } from './_routes/posts.js';
import { attemptsRouter } from './_routes/attempts.js';
import { certificatesRouter } from './_routes/certificates.js';
import { documentsRouter } from './_routes/documents.js';
import { leaderboardRouter } from './_routes/leaderboard.js';
import { accountsSheetRouter } from './_routes/accounts-sheet.js';
import { attendanceSheetRouter } from './_routes/attendance-sheet.js';

const app = express();
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/attempts', attemptsRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/accounts-sheet', accountsSheetRouter);
app.use('/api/attendance-sheet', attendanceSheetRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Lỗi máy chủ.' });
});

export default app;

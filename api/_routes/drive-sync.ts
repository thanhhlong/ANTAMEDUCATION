import { Router, Request, Response } from 'express';
import { upsertCsvFile, driveConfigured } from '../_lib/googleDrive.js';
import { buildCsv } from '../_lib/csv.js';

export const driveSyncRouter = Router();

// Same light deterrent pattern used before — an optional shared secret so this
// isn't a fully public write endpoint, without requiring full user auth plumbing.
function checkSyncSecret(req: Request, res: Response): boolean {
  const required = process.env.ACCOUNTS_SHEET_SYNC_SECRET;
  if (!required) return true;
  if (req.header('x-sync-secret') !== required) {
    res.status(401).json({ error: 'Sai mã đồng bộ.' });
    return false;
  }
  return true;
}

driveSyncRouter.get('/status', (_req, res) => {
  res.json({ configured: driveConfigured() });
});

const ROLE_LABEL: Record<string, string> = { admin: 'Quản trị viên', teacher: 'Giáo viên', student: 'Học sinh' };

interface AccountInput {
  name: string;
  email: string;
  password?: string;
  role: string;
  grade?: number | string;
}

driveSyncRouter.post('/accounts', async (req, res) => {
  if (!driveConfigured()) {
    res.status(503).json({ error: 'Chưa cấu hình Google Drive.' });
    return;
  }
  if (!checkSyncSecret(req, res)) return;

  const { users } = req.body ?? {};
  if (!Array.isArray(users)) {
    res.status(400).json({ error: 'Danh sách tài khoản không hợp lệ.' });
    return;
  }
  try {
    const rows = (users as AccountInput[]).map(u => [
      u.name,
      u.email,
      u.password || '',
      ROLE_LABEL[u.role] || u.role,
      u.grade != null ? String(u.grade) : '',
    ]);
    const csv = buildCsv(['Họ tên', 'Email', 'Mật khẩu', 'Vai trò', 'Khối'], rows);
    await upsertCsvFile('TaiKhoan.csv', csv);
    res.status(204).end();
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

interface AttendanceInput {
  studentName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
}

function fmtDateTime(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('vi-VN');
}

driveSyncRouter.post('/attendance', async (req, res) => {
  if (!driveConfigured()) {
    res.status(503).json({ error: 'Chưa cấu hình Google Drive.' });
    return;
  }
  if (!checkSyncSecret(req, res)) return;

  const { records } = req.body ?? {};
  if (!Array.isArray(records)) {
    res.status(400).json({ error: 'Danh sách điểm danh không hợp lệ.' });
    return;
  }
  try {
    const rows = (records as AttendanceInput[]).map(r => [
      r.studentName,
      r.date,
      fmtDateTime(r.checkIn),
      fmtDateTime(r.checkOut),
    ]);
    const csv = buildCsv(['Họ tên học sinh', 'Ngày', 'Giờ vào', 'Giờ ra'], rows);
    await upsertCsvFile('DiemDanh.csv', csv);
    res.status(204).end();
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

interface LessonInput {
  id: string;
  subject: string;
  grade: number;
  title: string;
  desc?: string;
  content?: string;
}

interface QuestionInput {
  subject: string;
  grade: number;
  lessonId: string;
  level: number;
  type: string;
  content: string;
  options?: string[];
  correct?: number;
  sampleAnswer?: string;
  keywords?: string[];
  explanation?: string;
}

const TYPE_LABEL: Record<string, string> = { mcq: 'Trắc nghiệm', short: 'Trả lời ngắn', essay: 'Tự luận' };

driveSyncRouter.post('/lessons', async (req, res) => {
  if (!driveConfigured()) {
    res.status(503).json({ error: 'Chưa cấu hình Google Drive.' });
    return;
  }
  if (!checkSyncSecret(req, res)) return;

  const { lessons, questions } = req.body ?? {};
  if (!Array.isArray(lessons) || !Array.isArray(questions)) {
    res.status(400).json({ error: 'Dữ liệu bài học/câu hỏi không hợp lệ.' });
    return;
  }
  try {
    const lessonTitleById = new Map<string, string>((lessons as LessonInput[]).map(l => [l.id, l.title]));
    const rows: string[][] = [];

    for (const l of lessons as LessonInput[]) {
      rows.push(['Bài học', l.subject, String(l.grade), l.title, '', l.content || l.desc || '', '', '', '', '', '', '']);
    }
    for (const q of questions as QuestionInput[]) {
      const correctAnswer =
        q.type === 'mcq' && q.options && q.correct != null
          ? q.options[q.correct] || ''
          : q.type === 'short'
          ? q.sampleAnswer || ''
          : q.keywords
          ? q.keywords.join('; ')
          : '';
      rows.push([
        TYPE_LABEL[q.type] || q.type,
        q.subject,
        String(q.grade),
        lessonTitleById.get(q.lessonId) || '',
        String(q.level),
        q.content,
        q.options?.[0] || '',
        q.options?.[1] || '',
        q.options?.[2] || '',
        q.options?.[3] || '',
        correctAnswer,
        q.explanation || '',
      ]);
    }
    const csv = buildCsv(
      ['Loại', 'Môn học', 'Khối', 'Bài học', 'Cấp độ', 'Nội dung', 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D', 'Đáp án đúng', 'Giải thích'],
      rows
    );
    await upsertCsvFile('BaiHocCauHoi.csv', csv);
    res.status(204).end();
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

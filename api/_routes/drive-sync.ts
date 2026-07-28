import { Router, Request, Response } from 'express';
import { upsertCsvFile, downloadCsvFile, driveConfigured } from '../_lib/googleDrive.js';
import { buildCsv, parseCsv } from '../_lib/csv.js';

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
const ROLE_KEY: Record<string, string> = { 'Quản trị viên': 'admin', 'Giáo viên': 'teacher', 'Học sinh': 'student' };

interface AccountInput {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  grade?: number | string;
}

// Rows keep a leading "Mã" (id) column, invisible to a casual reader but required so a
// round-trip read-back can restore the exact same account instead of minting new ids
// (which would break every attempt/certificate/attendance record that references it).
const ACCOUNTS_HEADER = ['Mã', 'Họ tên', 'Email', 'Mật khẩu', 'Vai trò', 'Khối'];

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
      u.id,
      u.name,
      u.email,
      u.password || '',
      ROLE_LABEL[u.role] || u.role,
      u.grade != null ? String(u.grade) : '',
    ]);
    const csv = buildCsv(ACCOUNTS_HEADER, rows);
    await upsertCsvFile('TaiKhoan.csv', csv);
    res.status(204).end();
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

driveSyncRouter.get('/accounts', async (_req, res) => {
  if (!driveConfigured()) {
    res.status(503).json({ error: 'Chưa cấu hình Google Drive.' });
    return;
  }
  try {
    const csv = await downloadCsvFile('TaiKhoan.csv');
    const allRows = csv ? parseCsv(csv) : [];
    const header = allRows[0] || [];
    const rows = allRows.slice(1);
    // Back-compat: a file exported before the "Mã" (id) column was added has only
    // 5 columns [Họ tên, Email, Mật khẩu, Vai trò, Khối]. Reading it with the new
    // 6-column layout silently shifts every field by one (name becomes id, email
    // becomes name, password becomes email, ...) — detect it via the header so an
    // old file already sitting on Drive doesn't corrupt every account on load.
    const isLegacy = header.length <= 5;
    const users = rows
      .filter(r => (isLegacy ? r[0] : r[0]))
      .map(r => {
        if (isLegacy) {
          const [name, email, password, roleLabel, grade] = r;
          return {
            id: 'legacy_' + (email || name || '').trim().toLowerCase(),
            name: name || '',
            email: email || '',
            password: password || undefined,
            role: ROLE_KEY[roleLabel] || roleLabel || 'student',
            grade: grade ? Number(grade) : undefined,
          };
        }
        return {
          id: r[0],
          name: r[1] || '',
          email: r[2] || '',
          password: r[3] || undefined,
          role: ROLE_KEY[r[4]] || r[4] || 'student',
          grade: r[5] ? Number(r[5]) : undefined,
        };
      });
    res.json({ users });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

interface AttendanceInput {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
}

// checkIn/checkOut are kept as raw ISO timestamps (not locale-formatted) so a
// round-trip read-back can parse them back exactly — a pretty "14:00 25/07/2026"
// string can't be reconstructed into an unambiguous Date reliably.
const ATTENDANCE_HEADER = ['Mã', 'Mã học sinh', 'Họ tên học sinh', 'Ngày', 'Giờ vào', 'Giờ ra'];

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
      r.id,
      r.studentId,
      r.studentName,
      r.date,
      r.checkIn || '',
      r.checkOut || '',
    ]);
    const csv = buildCsv(ATTENDANCE_HEADER, rows);
    await upsertCsvFile('DiemDanh.csv', csv);
    res.status(204).end();
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

driveSyncRouter.get('/attendance', async (_req, res) => {
  if (!driveConfigured()) {
    res.status(503).json({ error: 'Chưa cấu hình Google Drive.' });
    return;
  }
  try {
    const csv = await downloadCsvFile('DiemDanh.csv');
    const allRows = csv ? parseCsv(csv) : [];
    // Back-compat: a file exported before the "Mã"/"Mã học sinh" columns existed
    // only has 4 columns — the studentId link can't be reconstructed from that
    // layout, so treat it as no usable data rather than misreading the columns.
    const rows = (allRows[0] || []).length >= 6 ? allRows.slice(1) : [];
    const records = rows
      .filter(r => r[0])
      .map(r => ({
        id: r[0],
        studentId: r[1] || '',
        date: r[3] || '',
        checkIn: r[4] || undefined,
        checkOut: r[5] || undefined,
      }));
    res.json({ records });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

interface LessonInput {
  id: string;
  subject: string;
  grade: number;
  order: number;
  title: string;
  desc?: string;
  content?: string;
  driveLink?: string;
  contentHidden?: boolean;
  contentVisibleAt?: string;
  quizHidden?: boolean;
  quizVisibleAt?: string;
}

interface QuestionInput {
  id: string;
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
const TYPE_KEY: Record<string, string> = { 'Trắc nghiệm': 'mcq', 'Trả lời ngắn': 'short', 'Tự luận': 'essay' };

// Wider, technical schema (not a pretty report) so a round-trip read-back can
// reconstruct lessons/questions exactly — ids, lesson order, visibility scheduling,
// and the correct-answer *index* (not its text) all need to survive unambiguously.
const LESSONS_HEADER = [
  'Loại', 'Mã', 'Môn học', 'Khối', 'Thứ tự', 'Mã bài học', 'Cấp độ',
  'Tiêu đề bài học', 'Mô tả ngắn', 'Nội dung bài học', 'Link tài liệu',
  'Ẩn nội dung', 'Thời điểm hiện nội dung', 'Ẩn bài kiểm tra', 'Thời điểm hiện bài kiểm tra',
  'Nội dung câu hỏi', 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D',
  'Đáp án đúng (số)', 'Đáp án mẫu', 'Từ khoá', 'Giải thích',
];

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
    const rows: string[][] = [];

    for (const l of lessons as LessonInput[]) {
      rows.push([
        'Bài học', l.id, l.subject, String(l.grade), String(l.order), '', '',
        l.title, l.desc || '', l.content || '', l.driveLink || '',
        l.contentHidden ? 'TRUE' : 'FALSE', l.contentVisibleAt || '',
        l.quizHidden ? 'TRUE' : 'FALSE', l.quizVisibleAt || '',
        '', '', '', '', '', '', '', '', '',
      ]);
    }
    for (const q of questions as QuestionInput[]) {
      rows.push([
        TYPE_LABEL[q.type] || q.type, q.id, q.subject, String(q.grade), '', q.lessonId, String(q.level),
        '', '', '', '',
        '', '', '', '',
        q.content, q.options?.[0] || '', q.options?.[1] || '', q.options?.[2] || '', q.options?.[3] || '',
        q.type === 'mcq' && q.correct != null ? String(q.correct + 1) : '',
        q.sampleAnswer || '', q.keywords?.join('; ') || '', q.explanation || '',
      ]);
    }
    const csv = buildCsv(LESSONS_HEADER, rows);
    await upsertCsvFile('BaiHocCauHoi.csv', csv);
    res.status(204).end();
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

driveSyncRouter.get('/lessons', async (_req, res) => {
  if (!driveConfigured()) {
    res.status(503).json({ error: 'Chưa cấu hình Google Drive.' });
    return;
  }
  try {
    const csv = await downloadCsvFile('BaiHocCauHoi.csv');
    const allRows = csv ? parseCsv(csv) : [];
    // Back-compat: the older "pretty report" layout (12 columns, answers stored as
    // text) can't be told apart reliably from real content — treat anything short
    // of the current 24-column technical schema as no usable data.
    const rows = (allRows[0] || []).length >= 24 ? allRows.slice(1) : [];
    const lessons: LessonInput[] = [];
    const questions: QuestionInput[] = [];

    for (const r of rows) {
      if (!r[1]) continue;
      if (r[0] === 'Bài học') {
        lessons.push({
          id: r[1],
          subject: r[2] || '',
          grade: Number(r[3]) || 0,
          order: Number(r[4]) || 0,
          title: r[7] || '',
          desc: r[8] || '',
          content: r[9] || '',
          driveLink: r[10] || '',
          contentHidden: r[11] === 'TRUE',
          contentVisibleAt: r[12] || undefined,
          quizHidden: r[13] === 'TRUE',
          quizVisibleAt: r[14] || undefined,
        });
      } else {
        const type = TYPE_KEY[r[0]] || 'mcq';
        questions.push({
          id: r[1],
          subject: r[2] || '',
          grade: Number(r[3]) || 0,
          lessonId: r[5] || '',
          level: Number(r[6]) || 1,
          type,
          content: r[15] || '',
          options: type === 'mcq' ? [r[16] || '', r[17] || '', r[18] || '', r[19] || ''] : undefined,
          correct: type === 'mcq' && r[20] ? Number(r[20]) - 1 : undefined,
          sampleAnswer: type === 'short' ? r[21] || '' : undefined,
          keywords: type === 'essay' && r[22] ? r[22].split(';').map(k => k.trim()).filter(Boolean) : undefined,
          explanation: r[23] || '',
        });
      }
    }
    res.json({ lessons, questions });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

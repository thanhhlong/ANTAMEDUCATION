import { Router, Request, Response } from 'express';
import {
  upsertCsvFile, downloadCsvFile, driveConfigured,
  getDriveAccessToken, rootSyncFolderId, findSubfolderId,
} from '../_lib/googleDrive.js';
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

// Must match src/data/seedData.ts SUBJECTS/GRADES — api/ is a separate TS
// context from src/, so this is kept as its own small, stable copy rather
// than shared across the boundary.
const SUBJECTS = ['Toán', 'Tiếng Anh', 'Văn', 'KHTN'];
const GRADES = [6, 7, 8, 9];

// One CSV per lesson (Mã, Thứ tự, Tiêu đề, ...) — subject/grade aren't columns
// here since they're already encoded by the subject subfolder + Khối{n} filename.
const LESSON_HEADER = [
  'Mã', 'Thứ tự', 'Tiêu đề bài học', 'Mô tả ngắn', 'Nội dung bài học', 'Link tài liệu',
  'Ẩn nội dung', 'Thời điểm hiện nội dung', 'Ẩn bài kiểm tra', 'Thời điểm hiện bài kiểm tra',
];
const QUESTION_HEADER = [
  'Loại', 'Mã', 'Mã bài học', 'Cấp độ', 'Nội dung câu hỏi',
  'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D', 'Đáp án đúng (số)', 'Đáp án mẫu', 'Từ khoá', 'Giải thích',
];

function lessonRow(l: LessonInput): string[] {
  return [
    l.id, String(l.order), l.title, l.desc || '', l.content || '', l.driveLink || '',
    l.contentHidden ? 'TRUE' : 'FALSE', l.contentVisibleAt || '',
    l.quizHidden ? 'TRUE' : 'FALSE', l.quizVisibleAt || '',
  ];
}

function questionRow(q: QuestionInput): string[] {
  return [
    TYPE_LABEL[q.type] || q.type, q.id, q.lessonId, String(q.level), q.content,
    q.options?.[0] || '', q.options?.[1] || '', q.options?.[2] || '', q.options?.[3] || '',
    q.type === 'mcq' && q.correct != null ? String(q.correct + 1) : '',
    q.sampleAnswer || '', q.keywords?.join('; ') || '', q.explanation || '',
  ];
}

function parseLessonRow(r: string[], subject: string, grade: number): LessonInput | null {
  if (!r[0]) return null;
  return {
    id: r[0],
    subject,
    grade,
    order: Number(r[1]) || 0,
    title: r[2] || '',
    desc: r[3] || '',
    content: r[4] || '',
    driveLink: r[5] || '',
    contentHidden: r[6] === 'TRUE',
    contentVisibleAt: r[7] || undefined,
    quizHidden: r[8] === 'TRUE',
    quizVisibleAt: r[9] || undefined,
  };
}

function parseQuestionRow(r: string[], subject: string, grade: number): QuestionInput | null {
  if (!r[1]) return null;
  const type = TYPE_KEY[r[0]] || 'mcq';
  return {
    id: r[1],
    subject,
    grade,
    lessonId: r[2] || '',
    level: Number(r[3]) || 1,
    type,
    content: r[4] || '',
    options: type === 'mcq' ? [r[5] || '', r[6] || '', r[7] || '', r[8] || ''] : undefined,
    correct: type === 'mcq' && r[9] ? Number(r[9]) - 1 : undefined,
    sampleAnswer: type === 'short' ? r[10] || '' : undefined,
    keywords: type === 'essay' && r[11] ? r[11].split(';').map(k => k.trim()).filter(Boolean) : undefined,
    explanation: r[12] || '',
  };
}

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
    const token = await getDriveAccessToken();
    const root = rootSyncFolderId();
    const warnings: string[] = [];

    await Promise.all(SUBJECTS.map(async (subject) => {
      const subjectLessons = (lessons as LessonInput[]).filter(l => l.subject === subject);
      const subjectQuestions = (questions as QuestionInput[]).filter(q => q.subject === subject);
      if (subjectLessons.length === 0 && subjectQuestions.length === 0) return;

      let folderId: string | null;
      try {
        folderId = await findSubfolderId(token, root, subject);
      } catch (err) {
        warnings.push(`${subject}: ${(err as Error).message}`);
        return;
      }
      if (!folderId) {
        warnings.push(`Chưa có thư mục "${subject}" trong Drive — bỏ qua môn này.`);
        return;
      }

      await Promise.all(GRADES.map(async (grade) => {
        const gradeLessons = subjectLessons.filter(l => l.grade === grade);
        const gradeQuestions = subjectQuestions.filter(q => q.grade === grade);
        if (gradeLessons.length === 0 && gradeQuestions.length === 0) return;
        try {
          const lessonCsv = buildCsv(LESSON_HEADER, gradeLessons.map(lessonRow));
          const questionCsv = buildCsv(QUESTION_HEADER, gradeQuestions.map(questionRow));
          await Promise.all([
            upsertCsvFile(`BaiHoc_Khoi${grade}.csv`, lessonCsv, folderId!, token),
            upsertCsvFile(`CauHoi_Khoi${grade}.csv`, questionCsv, folderId!, token),
          ]);
        } catch (err) {
          warnings.push(`${subject} Khối ${grade}: ${(err as Error).message}`);
        }
      }));
    }));

    res.status(200).json({ synced: true, warnings: warnings.length ? warnings : undefined });
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
    const token = await getDriveAccessToken();
    const root = rootSyncFolderId();
    const lessons: LessonInput[] = [];
    const questions: QuestionInput[] = [];

    await Promise.all(SUBJECTS.map(async (subject) => {
      const folderId = await findSubfolderId(token, root, subject);
      if (!folderId) return;

      await Promise.all(GRADES.map(async (grade) => {
        const [lessonCsv, questionCsv] = await Promise.all([
          downloadCsvFile(`BaiHoc_Khoi${grade}.csv`, folderId, token),
          downloadCsvFile(`CauHoi_Khoi${grade}.csv`, folderId, token),
        ]);
        if (lessonCsv) {
          for (const r of parseCsv(lessonCsv).slice(1)) {
            const l = parseLessonRow(r, subject, grade);
            if (l) lessons.push(l);
          }
        }
        if (questionCsv) {
          for (const r of parseCsv(questionCsv).slice(1)) {
            const q = parseQuestionRow(r, subject, grade);
            if (q) questions.push(q);
          }
        }
      }));
    }));

    res.json({ lessons, questions });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

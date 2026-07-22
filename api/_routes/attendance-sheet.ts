import { Router, Request, Response } from 'express';
import { appendAttendanceRow, fullSyncAttendance, sheetsConfigured, SheetAttendanceRow } from '../_lib/googleSheets.js';

export const attendanceSheetRouter = Router();

// Same light deterrent pattern as accounts-sheet — see that file for rationale.
function checkSyncSecret(req: Request, res: Response): boolean {
  const required = process.env.ACCOUNTS_SHEET_SYNC_SECRET;
  if (!required) return true;
  if (req.header('x-sync-secret') !== required) {
    res.status(401).json({ error: 'Sai mã đồng bộ.' });
    return false;
  }
  return true;
}

attendanceSheetRouter.get('/status', (_req, res) => {
  res.json({ configured: sheetsConfigured() });
});

attendanceSheetRouter.post('/append', async (req, res) => {
  if (!sheetsConfigured()) {
    res.status(503).json({ error: 'Chưa cấu hình Google Sheet.' });
    return;
  }
  if (!checkSyncSecret(req, res)) return;

  const { studentName, date, checkIn, checkOut } = req.body ?? {};
  if (!studentName || !date) {
    res.status(400).json({ error: 'Thiếu thông tin điểm danh.' });
    return;
  }
  try {
    await appendAttendanceRow({ studentName, date, checkIn, checkOut } as SheetAttendanceRow);
    res.status(204).end();
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

attendanceSheetRouter.post('/full-sync', async (req, res) => {
  if (!sheetsConfigured()) {
    res.status(503).json({ error: 'Chưa cấu hình Google Sheet.' });
    return;
  }
  if (!checkSyncSecret(req, res)) return;

  const { records } = req.body ?? {};
  if (!Array.isArray(records)) {
    res.status(400).json({ error: 'Danh sách điểm danh không hợp lệ.' });
    return;
  }
  try {
    await fullSyncAttendance(records as SheetAttendanceRow[]);
    res.json({ synced: records.length });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

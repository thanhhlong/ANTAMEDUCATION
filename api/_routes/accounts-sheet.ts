import { Router, Request, Response } from 'express';
import { appendAccountRow, fullSyncAccounts, sheetsConfigured, SheetAccountRow } from '../_lib/googleSheets.js';

export const accountsSheetRouter = Router();

// Frontend has no auth wired to this API yet, so this shared secret (optional)
// is only a light deterrent against stray automated hits — anyone who can read
// the client bundle can also read the secret if one is set from there.
function checkSyncSecret(req: Request, res: Response): boolean {
  const required = process.env.ACCOUNTS_SHEET_SYNC_SECRET;
  if (!required) return true;
  if (req.header('x-sync-secret') !== required) {
    res.status(401).json({ error: 'Sai mã đồng bộ.' });
    return false;
  }
  return true;
}

accountsSheetRouter.get('/status', (_req, res) => {
  res.json({ configured: sheetsConfigured() });
});

accountsSheetRouter.post('/append', async (req, res) => {
  if (!sheetsConfigured()) {
    res.status(503).json({ error: 'Chưa cấu hình Google Sheet.' });
    return;
  }
  if (!checkSyncSecret(req, res)) return;

  const { name, email, password, role, grade, date } = req.body ?? {};
  if (!name || !email || !role) {
    res.status(400).json({ error: 'Thiếu thông tin tài khoản.' });
    return;
  }
  try {
    await appendAccountRow({ name, email, password, role, grade, date } as SheetAccountRow);
    res.status(204).end();
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

accountsSheetRouter.post('/full-sync', async (req, res) => {
  if (!sheetsConfigured()) {
    res.status(503).json({ error: 'Chưa cấu hình Google Sheet.' });
    return;
  }
  if (!checkSyncSecret(req, res)) return;

  const { accounts } = req.body ?? {};
  if (!Array.isArray(accounts)) {
    res.status(400).json({ error: 'Danh sách tài khoản không hợp lệ.' });
    return;
  }
  try {
    await fullSyncAccounts(accounts as SheetAccountRow[]);
    res.json({ synced: accounts.length });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

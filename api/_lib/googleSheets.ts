import jwt from 'jsonwebtoken';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DEFAULT_SHEET_ID = '1XYxVFmb48osTSmE1DJ2N9AEZYgbdQUjpmcITGTv7vCA';

interface Credentials {
  email: string;
  privateKey: string;
  sheetId: string;
  tabName: string;
}

function getCredentials(): Credentials | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) return null;
  // Vercel env values can't hold literal newlines comfortably, so the key is
  // usually stored with escaped "\n" sequences — unescape them here.
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
  const sheetId = process.env.ACCOUNTS_SHEET_ID || DEFAULT_SHEET_ID;
  const tabName = process.env.ACCOUNTS_SHEET_TAB_NAME || 'Sheet1';
  return { email, privateKey, sheetId, tabName };
}

export function sheetsConfigured(): boolean {
  return getCredentials() !== null;
}

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: email, scope: SHEETS_SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 },
    privateKey,
    { algorithm: 'RS256' }
  );

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`Không lấy được access token Google: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface SheetAccountRow {
  name: string;
  email: string;
  password?: string;
  role: string;
  grade?: number | string;
  date?: string;
}

const HEADER = ['Họ tên', 'Email', 'Mật khẩu', 'Vai trò', 'Khối', 'Thời điểm đăng ký'];

function toRow(u: SheetAccountRow): string[] {
  return [
    u.name,
    u.email,
    u.password || '',
    u.role,
    u.grade != null ? String(u.grade) : '',
    u.date || new Date().toISOString(),
  ];
}

export async function appendAccountRow(user: SheetAccountRow): Promise<void> {
  const creds = getCredentials();
  if (!creds) throw new Error('Chưa cấu hình Google Service Account.');
  const token = await getAccessToken(creds.email, creds.privateKey);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${creds.sheetId}/values/${encodeURIComponent(creds.tabName)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [toRow(user)] }),
    }
  );
  if (!res.ok) {
    throw new Error(`Ghi Google Sheet thất bại: ${res.status} ${await res.text()}`);
  }
}

export async function fullSyncAccounts(users: SheetAccountRow[]): Promise<void> {
  const creds = getCredentials();
  if (!creds) throw new Error('Chưa cấu hình Google Service Account.');
  const token = await getAccessToken(creds.email, creds.privateKey);

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${creds.sheetId}/values/${encodeURIComponent(creds.tabName)}:clear`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );

  const values = [HEADER, ...users.map(toRow)];
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${creds.sheetId}/values/${encodeURIComponent(creds.tabName)}!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  if (!res.ok) {
    throw new Error(`Ghi Google Sheet thất bại: ${res.status} ${await res.text()}`);
  }
}

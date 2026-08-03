import jwt from 'jsonwebtoken';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
// Folder created in the Admin's own Google Drive, shared with the service account
// below as Editor — same service account already used for the account/attendance data.
const DEFAULT_FOLDER_ID = '1pe_shunN1J9-ZrqVyYIBu5zxlFeuWRYL';

interface Credentials {
  email: string;
  privateKey: string;
  folderId: string;
}

function getCredentials(): Credentials | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) return null;
  // Vercel env values can't hold literal newlines comfortably, so the key is
  // usually stored with escaped "\n" sequences — unescape them here.
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
  const folderId = process.env.SYNC_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;
  return { email, privateKey, folderId };
}

export function driveConfigured(): boolean {
  return getCredentials() !== null;
}

// The root shared sync folder's ID — the default landing spot for files that
// aren't organized into a subject subfolder.
export function rootSyncFolderId(): string {
  return getCredentials()?.folderId || DEFAULT_FOLDER_ID;
}

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: email, scope: DRIVE_SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 },
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

// Exposed so callers needing several calls against the same token (e.g. syncing
// many subject/grade files in one batch) can fetch it once instead of per-file.
export async function getDriveAccessToken(): Promise<string> {
  const creds = getCredentials();
  if (!creds) throw new Error('Chưa cấu hình Google Service Account.');
  return getAccessToken(creds.email, creds.privateKey);
}

async function findChild(token: string, parentId: string, name: string, mimeType?: string): Promise<string | null> {
  const escaped = name.replace(/'/g, "\\'");
  let q = `name='${escaped}' and '${parentId}' in parents and trashed=false`;
  if (mimeType) q += ` and mimeType='${mimeType}'`;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Tìm file trên Google Drive thất bại: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { files: { id: string }[] };
  return data.files[0]?.id ?? null;
}

// Finds a subfolder by name directly under the given parent folder. Returns null
// (never creates one) — subfolders must be pre-created by the Drive owner, since
// the service account has no storage quota of its own to create new objects with.
export async function findSubfolderId(token: string, parentId: string, name: string): Promise<string | null> {
  return findChild(token, parentId, name, 'application/vnd.google-apps.folder');
}

async function findFileId(token: string, folderId: string, filename: string): Promise<string | null> {
  return findChild(token, folderId, filename);
}

// Overwrites (or creates, the first time) a CSV file by name inside the given Drive
// folder (defaults to the root shared sync folder). Each dataset gets its own file,
// rewritten in full on every sync — unlike Sheets there's no row-level append API
// for a plain Drive file.
export async function upsertCsvFile(filename: string, csvContent: string, folderId?: string, token?: string): Promise<void> {
  const creds = getCredentials();
  if (!creds) throw new Error('Chưa cấu hình Google Service Account.');
  const accessToken = token || (await getAccessToken(creds.email, creds.privateKey));
  const targetFolderId = folderId || creds.folderId;
  const existingId = await findFileId(accessToken, targetFolderId, filename);

  if (existingId) {
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'text/csv; charset=utf-8' },
      body: csvContent,
    });
    if (!res.ok) {
      throw new Error(`Ghi file Google Drive thất bại: ${res.status} ${await res.text()}`);
    }
    return;
  }

  const boundary = 'antam_sync_boundary';
  const metadata = JSON.stringify({ name: filename, parents: [targetFolderId], mimeType: 'text/csv' });
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: text/csv; charset=utf-8\r\n\r\n${csvContent}\r\n` +
    `--${boundary}--`;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) {
    throw new Error(`Tạo file Google Drive thất bại: ${res.status} ${await res.text()}`);
  }
}

// Reads a CSV file's raw text content by name from the given Drive folder (defaults
// to the root shared sync folder). Returns null if the file doesn't exist yet —
// callers should treat that as "no data available", not an error.
export async function downloadCsvFile(filename: string, folderId?: string, token?: string): Promise<string | null> {
  const creds = getCredentials();
  if (!creds) throw new Error('Chưa cấu hình Google Service Account.');
  const accessToken = token || (await getAccessToken(creds.email, creds.privateKey));
  const targetFolderId = folderId || creds.folderId;
  const fileId = await findFileId(accessToken, targetFolderId, filename);
  if (!fileId) return null;

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Đọc file Google Drive thất bại: ${res.status} ${await res.text()}`);
  }
  return await res.text();
}

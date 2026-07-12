// Persists data to localStorage so accounts and student scores survive page reloads
// and new app deployments, instead of resetting to the in-code seed data every time.

const ACCOUNTS_KEY = "antam_accounts_v1";   // GV / HS / Admin account records
const SCORES_KEY = "antam_scores_v1";       // Student exam attempts + certificates

function load<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, data: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — fail silently, in-memory state still works.
  }
}

export function loadAccounts<T>(): T | null {
  return load<T>(ACCOUNTS_KEY);
}

export function saveAccounts(users: unknown) {
  save(ACCOUNTS_KEY, users);
}

export interface ScoresData {
  attempts: unknown[];
  certificates: unknown[];
}

export function loadScores(): ScoresData | null {
  return load<ScoresData>(SCORES_KEY);
}

export function saveScores(attempts: unknown[], certificates: unknown[]) {
  save(SCORES_KEY, { attempts, certificates });
}

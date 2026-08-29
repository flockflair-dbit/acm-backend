const TOKEN_KEY = 'acm-admin-token';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getAdminToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isAdminLoggedIn(): boolean {
  return Boolean(getAdminToken());
}

export function adminAuthHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = getAdminToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function adminLogin(password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || 'Could not sign in as admin');
  }
  setAdminToken(body.token);
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  const res = await fetch(`${API_BASE}/api/auth/admin/me`, {
    headers: adminAuthHeaders(),
  });
  if (!res.ok) {
    clearAdminToken();
    return false;
  }
  return true;
}

export function adminLogout(): void {
  clearAdminToken();
}

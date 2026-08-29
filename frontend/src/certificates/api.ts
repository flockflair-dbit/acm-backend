import type { CertificateEvent, GenerateSuccess, OverlayConfig } from './types';
import { adminAuthHeaders } from '../admin/session';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function assetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}

function withAssets(event: CertificateEvent): CertificateEvent {
  return {
    ...event,
    templateUrl: event.templateUrl ? assetUrl(event.templateUrl) : null,
  };
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.message || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function listEvents(): Promise<CertificateEvent[]> {
  const res = await fetch(`${API_BASE}/api/certificates/events`);
  if (!res.ok) throw new Error(await parseError(res));
  const data: CertificateEvent[] = await res.json();
  return data.map(withAssets);
}

export async function listAdminEvents(): Promise<CertificateEvent[]> {
  const res = await fetch(`${API_BASE}/api/certificates/admin/events`, {
    headers: adminAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data: CertificateEvent[] = await res.json();
  return data.map(withAssets);
}

export async function createEvent(payload: {
  title: string;
  date: string;
  description: string;
}): Promise<CertificateEvent> {
  const res = await fetch(`${API_BASE}/api/certificates/events`, {
    method: 'POST',
    headers: adminAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return withAssets(await res.json());
}

export async function updateEvent(
  id: string,
  payload: {
    title?: string;
    date?: string;
    description?: string;
    overlay?: OverlayConfig;
    attendance?: string;
  },
): Promise<CertificateEvent> {
  const res = await fetch(`${API_BASE}/api/certificates/events/${id}`, {
    method: 'PUT',
    headers: adminAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return withAssets(await res.json());
}

export async function uploadTemplate(id: string, file: File): Promise<CertificateEvent> {
  const data = new FormData();
  data.append('template', file);
  const res = await fetch(`${API_BASE}/api/certificates/events/${id}/template`, {
    method: 'POST',
    headers: adminAuthHeaders(),
    body: data,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return withAssets(await res.json());
}

export async function saveAttendance(id: string, attendance: string): Promise<CertificateEvent> {
  const res = await fetch(`${API_BASE}/api/certificates/events/${id}/attendance`, {
    method: 'POST',
    headers: adminAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ attendance }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return withAssets(await res.json());
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/certificates/events/${id}`, {
    method: 'DELETE',
    headers: adminAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function generateCertificate(
  eventId: string,
  acmId: string,
): Promise<GenerateSuccess> {
  const res = await fetch(`${API_BASE}/api/certificates/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, acmId }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const body: GenerateSuccess = await res.json();
  return { ...body, event: withAssets(body.event) };
}

import type { LicenseState } from './types';

const SLUG = 'scan-reading-pack';
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `sb_license_verdict:${SLUG}`;
const DAY = 86_400_000;
const BILLING_BASE = import.meta.env.VITE_BILLING_BASE || 'https://api.sociobot.in';

export const checkoutUrl = `${BILLING_BASE}/api/v1/products/${SLUG}/checkout`;

function cachedState(token: string | null): LicenseState {
  try {
    const value = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}') as LicenseState;
    if (value.token === token && typeof value.valid === 'boolean') return value;
  } catch { /* an invalid cache is simply ignored */ }
  return { token, valid: false, checkedAt: 0 };
}

export function acceptReturnedLicense(): void {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token.trim());
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export async function getLicenseState(force = false): Promise<LicenseState> {
  const token = localStorage.getItem(TOKEN_KEY);
  const cached = cachedState(token);
  if (!token) return cached;
  if (!force && cached.valid && Date.now() - cached.checkedAt < DAY) return cached;

  try {
    const response = await fetch(`${BILLING_BASE}/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('License service unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    const state = { token, valid: result.valid, reason: result.reason, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(state));
    return state;
  } catch {
    return cached;
  }
}

export function restoreLicense(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function removeLicense(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERDICT_KEY);
}

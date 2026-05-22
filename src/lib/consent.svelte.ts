const STORAGE_KEY = 'lcb_consent';

// Bump CONSENT_VERSION whenever the categories, defaults, or policy text change
// in a way that requires re-asking the user. Bumping invalidates every stored
// decision, so the banner re-appears on next visit.
const CONSENT_VERSION = 1;

// How long a stored decision stays valid. After this window the banner returns
// even if the user previously accepted/rejected.
export const CONSENT_TTL_MS = 180 * 24 * 60 * 60 * 1000; // ~6 months

export function getConsentExpiry(decidedAt: string | null): Date | null {
  if (!decidedAt) return null;
  const ts = Date.parse(decidedAt);
  if (Number.isNaN(ts)) return null;
  return new Date(ts + CONSENT_TTL_MS);
}

export interface ConsentState {
  version: number;
  decided: boolean;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string | null;
}

const defaultState: ConsentState = {
  version: CONSENT_VERSION,
  decided: false,
  analytics: false,
  marketing: false,
  decidedAt: null
};

function isExpired(decidedAt: string | null): boolean {
  if (!decidedAt) return true;
  const ts = Date.parse(decidedAt);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > CONSENT_TTL_MS;
}

function load(): ConsentState {
  if (typeof window === 'undefined') return { ...defaultState };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.version !== CONSENT_VERSION) return { ...defaultState };
    if (isExpired(parsed.decidedAt ?? null)) return { ...defaultState };
    return { ...defaultState, ...parsed };
  } catch {
    return { ...defaultState };
  }
}

export const consent = $state<ConsentState>(load());

export const consentUi = $state({ modalOpen: false });

export function openConsentModal(): void {
  consentUi.modalOpen = true;
}

export function closeConsentModal(): void {
  consentUi.modalOpen = false;
}

function persist(next: ConsentState): void {
  consent.version = next.version;
  consent.decided = next.decided;
  consent.analytics = next.analytics;
  consent.marketing = next.marketing;
  consent.decidedAt = next.decidedAt;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable (private mode, quota). Consent stays in-memory.
  }
}

export function acceptAll(): void {
  persist({
    version: CONSENT_VERSION,
    decided: true,
    analytics: true,
    marketing: true,
    decidedAt: new Date().toISOString()
  });
}

export function rejectAll(): void {
  persist({
    version: CONSENT_VERSION,
    decided: true,
    analytics: false,
    marketing: false,
    decidedAt: new Date().toISOString()
  });
}

export function saveChoices(choices: { analytics: boolean; marketing: boolean }): void {
  persist({
    version: CONSENT_VERSION,
    decided: true,
    analytics: choices.analytics,
    marketing: choices.marketing,
    decidedAt: new Date().toISOString()
  });
}

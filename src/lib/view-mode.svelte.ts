const STORAGE_KEY = 'lcb_view_mode';
const HINT_KEY = 'lcb_view_hint_seen';
const RANK_HINT_KEY = 'lcb_rank_hint_seen';

export type ViewMode = 'splash' | 'list';

function load(): ViewMode {
  if (typeof window === 'undefined') return 'splash';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === 'list' || raw === 'splash' ? raw : 'splash';
  } catch {
    return 'splash';
  }
}

function loadHintSeen(): boolean {
  if (typeof window === 'undefined') return true; // Don't render the hint server-side.
  try {
    return window.localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return true;
  }
}

export const viewMode = $state<{ value: ViewMode }>({ value: load() });

/** True once the user has either tried the list view or dismissed the hint bubble. */
export const viewHint = $state<{ seen: boolean }>({ seen: loadHintSeen() });

export function setViewMode(next: ViewMode): void {
  viewMode.value = next;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Ignore — view stays in-memory only.
  }
  // First time they actually use the list view, hide the hint forever.
  if (next === 'list') dismissViewHint();
}

export function dismissViewHint(): void {
  if (viewHint.seen) return;
  viewHint.seen = true;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HINT_KEY, '1');
  } catch {
    // Ignore — hint stays dismissed in-memory only.
  }
}

function loadRankHintSeen(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(RANK_HINT_KEY) === '1';
  } catch {
    return true;
  }
}

/** True once the user has either clicked a rank cell or dismissed the rank hint bubble. */
export const rankHint = $state<{ seen: boolean }>({ seen: loadRankHintSeen() });

export function dismissRankHint(): void {
  if (rankHint.seen) return;
  rankHint.seen = true;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RANK_HINT_KEY, '1');
  } catch {
    // Ignore — hint stays dismissed in-memory only.
  }
}

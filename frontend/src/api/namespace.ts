const STORAGE_KEY = 'phrasebook.namespace';

/**
 * Applies a `#k=…` fragment to the stored namespace, returning true if the
 * active namespace actually changed.
 *
 *   #k=marmalade  → switch to private library "marmalade"
 *   #k=           → switch back to the shared "default" library
 *   (no k param)  → no change; keep whatever was last selected
 *
 * The `#k=` is deliberately left in the URL so the page can be bookmarked /
 * added to the home screen and re-apply the library on every visit — important
 * on iOS, where localStorage is evicted after ~7 days of inactivity.
 */
function applyHash(): boolean {
  const raw = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(raw);
  if (!params.has('k')) return false;

  const word = (params.get('k') ?? '').trim();
  // An empty value or the reserved word "default" returns to the shared library.
  const next = word && word.toLowerCase() !== 'default' ? word : null;
  const prev = localStorage.getItem(STORAGE_KEY);

  if (next) localStorage.setItem(STORAGE_KEY, next);
  else localStorage.removeItem(STORAGE_KEY);

  return next !== prev;
}

/**
 * Call once at bootstrap. Captures any `#k=…` already in the URL, then keeps
 * reacting to later hash edits: changing the `#k=` value and pressing Enter is
 * a same-document navigation (no reload), so we listen for `hashchange` and
 * reload when the selected library actually changes, forcing a refetch.
 *
 * With no namespace stored, requests omit the header and the backend serves the
 * "default" library.
 */
export function initNamespace(): void {
  applyHash();
  window.addEventListener('hashchange', () => {
    if (applyHash()) window.location.reload();
  });
}

export function getNamespace(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

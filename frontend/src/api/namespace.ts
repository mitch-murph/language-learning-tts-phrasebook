const STORAGE_KEY = 'phrasebook.namespace';

/**
 * Removes the `k` param from the URL hash without reloading, preserving any
 * other hash params, so the namespace word doesn't linger in the address bar
 * or browser history after it's been captured.
 */
function stripKeyFromHash(): void {
  const raw = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(raw);
  params.delete('k');
  const rest = params.toString();
  const url = window.location.pathname + window.location.search + (rest ? `#${rest}` : '');
  window.history.replaceState(null, '', url);
}

/**
 * Applies a `#k=…` fragment to the stored namespace, returning true if the
 * active namespace actually changed.
 *
 *   #k=marmalade  → switch to private library "marmalade"
 *   #k=           → switch back to the shared "default" library
 *   (no k param)  → no change; keep whatever was last selected
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
  stripKeyFromHash();

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

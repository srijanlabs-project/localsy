const STORAGE_HOST_MARKER = 'storageapi.dev';

export function isStorageHostedUrl(value: string): boolean {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.hostname.endsWith(STORAGE_HOST_MARKER);
  } catch {
    return false;
  }
}

// An image path a browser can actually load, or '' so the caller can leave the
// image block out entirely.
//
// Imported listings carry Windows-relative paths from the source CSV —
// `photos\localisy04217_1.jpg` — for files that were never uploaded. Those are
// non-empty strings, so every "does this listing have a photo?" check said yes
// and every card rendered a broken tile. Only an absolute web URL, a
// site-relative path, or a data URI can be displayed.
export function getDisplayableImageUrl(value: unknown): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('data:')) return trimmed;
  return '';
}

export function getMediaProxyUrl(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (!isStorageHostedUrl(trimmed)) return trimmed;
  return `/api/media/proxy?source=${encodeURIComponent(trimmed)}`;
}

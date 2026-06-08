const STORAGE_HOST_MARKER = 'storageapi.dev';

export function isStorageHostedUrl(value: string): boolean {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.hostname.endsWith(STORAGE_HOST_MARKER);
  } catch {
    return false;
  }
}

export function getMediaProxyUrl(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (!isStorageHostedUrl(trimmed)) return trimmed;
  return `/api/media/proxy?source=${encodeURIComponent(trimmed)}`;
}

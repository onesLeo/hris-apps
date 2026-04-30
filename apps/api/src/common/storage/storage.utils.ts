import { resolve, sep } from 'node:path';

export function normalizeStorageKey(storageKey: string): string {
  const normalized = storageKey.replace(/^\/+/, '');
  const segments = normalized.split('/');

  if (!normalized || segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')) {
    throw new Error(`Invalid storage key: ${storageKey}`);
  }

  if (storageKey.includes('\\')) {
    throw new Error(`Invalid storage key: ${storageKey}`);
  }

  return normalized;
}

export function resolveStoragePath(rootDir: string, storageKey: string): string {
  const safeKey = normalizeStorageKey(storageKey);
  const absoluteRoot = resolve(rootDir);
  const absolutePath = resolve(absoluteRoot, safeKey);
  const rootPrefix = absoluteRoot.endsWith(sep) ? absoluteRoot : `${absoluteRoot}${sep}`;

  if (absolutePath !== absoluteRoot && !absolutePath.startsWith(rootPrefix)) {
    throw new Error(`Storage key escapes configured root: ${storageKey}`);
  }

  return absolutePath;
}

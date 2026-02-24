export const DEFAULT_BRAND_NAME = 'PrologezPrime';

export function resolveBrandName(value?: string | null): string {
  const normalized = String(value ?? '').trim();

  if (normalized.length === 0) {
    return DEFAULT_BRAND_NAME;
  }

  return normalized;
}

export function resolveBrandInitial(value?: string | null): string {
  const brandName = resolveBrandName(value);
  const firstAlphaNumeric = brandName.replace(/[^a-z0-9]/gi, '').charAt(0);

  return (firstAlphaNumeric || 'P').toUpperCase();
}

import { DEFAULT_TTL_SECONDS, HttpError, REGIONS } from '@metallichq/shared';

export function validateRegion(region?: string): string | undefined {
  if (!region) {
    return undefined;
  }

  if (!REGIONS.includes(region)) {
    throw HttpError.badRequest(`Region "${region}" is not supported`);
  }

  return region;
}

export function validateTtlSeconds(ttlSec?: number | null): number | null {
  if (ttlSec === undefined) {
    return DEFAULT_TTL_SECONDS;
  }

  if (ttlSec === null) {
    return null;
  }

  if (ttlSec < 30) {
    throw HttpError.badRequest('TTL must be at least 30 seconds');
  }

  if (ttlSec > 86400) {
    throw HttpError.badRequest(
      `TTL must be less than or equal to 24 hours (86400s); To keep the computer running indefinitely, set "ttl_seconds" to "null"`
    );
  }

  return ttlSec;
}

import { envVars } from '@metallichq/shared';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: `${envVars.FLY_API_HOSTNAME}`,
  headers: {
    Authorization: `Bearer ${envVars.FLY_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

type RetryableConfig = AxiosRequestConfig & {
  __rateLimitRetryCount?: number;
};

const MAX_RATE_LIMIT_RETRIES = 5;
const BASE_DELAY_MS = 400;
const MAX_DELAY_MS = 60_000;
const JITTER_RANGE_MS = 100;

function isRateLimit(
  error: unknown
): error is AxiosError<{ error?: string; message?: string; errors?: { message?: string }[] }> {
  if (!axios.isAxiosError(error) || !error.response || error.response.status !== 429) {
    return false;
  }

  const data = error.response.data;
  const msg =
    typeof data === 'string'
      ? data.toLowerCase()
      : (data?.error || data?.message || data?.errors?.[0]?.message || '').toLowerCase();

  return msg.includes('rate limit') || msg.includes('resource_exhausted');
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (!isRateLimit(error)) {
      return Promise.reject(error);
    }

    const cfg: RetryableConfig = {
      ...error.config!,
      headers: { ...error.config!.headers }
    };

    cfg.__rateLimitRetryCount = (cfg.__rateLimitRetryCount ?? 0) + 1;
    if (cfg.__rateLimitRetryCount > MAX_RATE_LIMIT_RETRIES) {
      const err = new Error(`Rate‑limit retry exhausted after ${MAX_RATE_LIMIT_RETRIES} attempts: ${error.message}`);
      (err as any).originalError = error;
      return Promise.reject(err);
    }

    let delay = BASE_DELAY_MS * 2 ** (cfg.__rateLimitRetryCount - 1);
    const ra = error.response!.headers['retry-after'];
    if (ra) {
      const secs = Number(ra);
      delay = !Number.isNaN(secs) ? secs * 1_000 : Math.max(0, Date.parse(ra) - Date.now());
    }

    delay = Math.min(delay, MAX_DELAY_MS);
    delay += Math.round(Math.random() * JITTER_RANGE_MS);

    await new Promise((r) => setTimeout(r, delay));
    return api.request(cfg);
  }
);

export { api };

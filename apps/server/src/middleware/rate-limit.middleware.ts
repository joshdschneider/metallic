import { envVars, getLogger } from '@metallichq/shared';
import type { NextFunction, Request, Response } from 'express';
import { RateLimiterMemory, RateLimiterRedis, RateLimiterRes, type IRateLimiterOptions } from 'rate-limiter-flexible';
import { createClient } from 'redis';

const logger = getLogger('RateLimiter');

const redisClient = await (async () => {
  const client = createClient({
    url: envVars.REDIS_URL,
    disableOfflineQueue: true
  });

  client.on('error', (err) => {
    logger.error(`Redis error: ${err}`);
  });

  await client.connect();
  return client;
})();

const rateLimiter = (() => {
  const opts: IRateLimiterOptions = {
    keyPrefix: 'middleware',
    points: envVars.RATE_LIMIT_PER_MIN,
    duration: 60,
    blockDuration: 0
  };

  if (redisClient) {
    return new RateLimiterRedis({
      storeClient: redisClient,
      ...opts
    });
  }

  return new RateLimiterMemory(opts);
})();

const getUniqueClientKey = (req: Request, res: Response): string => {
  if ('organization' in res.locals) {
    return `organization-${res.locals['organization'].id}`;
  } else {
    return `ip-${req.ip}`;
  }
};

const setRateLimitHeaders = (
  res: Response,
  values: {
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
  }
) => {
  res.setHeader('X-RateLimit-Limit', values.limit);
  res.setHeader('X-RateLimit-Remaining', values.remaining);
  res.setHeader('X-RateLimit-Reset', values.reset);
  if (values.retryAfter) {
    res.setHeader('Retry-After', values.retryAfter);
  }
};

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const clientKey = getUniqueClientKey(req, res);

  try {
    const rateLimiterRes = await rateLimiter.consume(clientKey);
    const resetEpoch = Math.floor(new Date(Date.now() + rateLimiterRes.msBeforeNext).getTime() / 1000);

    setRateLimitHeaders(res, {
      limit: rateLimiter.points,
      remaining: rateLimiterRes.remainingPoints,
      reset: resetEpoch
    });

    next();
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      const retryAfter = Math.floor(err.msBeforeNext / 1000);
      const resetEpoch = Math.floor(new Date(Date.now() + err.msBeforeNext).getTime() / 1000);

      setRateLimitHeaders(res, {
        limit: rateLimiter.points,
        remaining: err.remainingPoints,
        reset: resetEpoch,
        retryAfter
      });

      logger.info(`Rate limit exceeded for client ${clientKey}: ${req.method} ${req.path}`);
      res.status(429).json({ name: 'RateLimitError', message: 'Too many requests' });
    } else {
      logger.error('Failed to compute rate limit', err);
      res.status(500).json({ name: 'InternalServerError', message: 'Failed to compute rate limit' });
    }
  }
};

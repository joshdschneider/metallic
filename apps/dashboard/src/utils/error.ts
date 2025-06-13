import * as Sentry from '@sentry/react';

export const captureException = (err: unknown): void => {
  if (import.meta.env.NODE_ENV === 'production' && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(err);
  } else {
    console.error(err);
  }
};

import { envVars } from '@metallichq/shared';
import type { SetOption } from 'cookies';

const getCookieDomain = (): string => {
  const hostname = new URL(envVars.SERVER_URL).hostname;
  const parts = hostname.split('.');
  const rootDomain = parts.slice(-2).join('.');
  return '.' + rootDomain;
};

export const cookieOpts: SetOption =
  envVars.NODE_ENV === 'production'
    ? {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: getCookieDomain()
      }
    : {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
      };

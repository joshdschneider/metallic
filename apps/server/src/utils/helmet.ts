import { HelmetOptions } from 'helmet';

export const helmetOptions: HelmetOptions = {
  xssFilter: true,
  noSniff: true,
  ieNoOpen: true,
  hidePoweredBy: true,
  dnsPrefetchControl: true,
  frameguard: { action: 'sameorigin' },
  hsts: { maxAge: 5184000 }
};

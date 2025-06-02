import { envVars } from '@metallichq/shared';
import { CorsOptions } from 'cors';

export const apiCorsOptions: CorsOptions = {
  origin: '*'
  // todo
};

export const webCorsOptions: CorsOptions = {
  origin: envVars.DASHBOARD_URL,
  credentials: true
};

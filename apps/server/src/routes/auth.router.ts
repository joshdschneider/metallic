import express from 'express';
import {
  acceptInvitation,
  getAuthenticatedUser,
  getInvitationByToken,
  getOauthUrl,
  logout,
  oauthCallback,
  sendCode,
  switchOrganization,
  verifyCode
} from '../controllers/auth.controller.js';
import { sessionAuth } from '../middleware/access.middleware.js';

const authRouter = express.Router();

authRouter.route('/send-code').post(sendCode);
authRouter.route('/verify-code').post(verifyCode);
authRouter.route('/invitation').get(getInvitationByToken);
authRouter.route('/accept-invitation').post(acceptInvitation);
authRouter.route('/oauth-url').get(getOauthUrl);
authRouter.route('/oauth-callback').get(oauthCallback);

authRouter.use(sessionAuth);
authRouter.route('/me').get(getAuthenticatedUser);
authRouter.route('/switch').get(switchOrganization);
authRouter.route('/logout').get(logout);

export { authRouter };

import {
  envVars,
  HttpError,
  OrganizationService,
  SESSION_COOKIE_KEY,
  UserService,
  WorkOSClient
} from '@metallichq/shared';
import { InvitationObject, InvitationState, UserObject } from '@metallichq/types';
import Cookies from 'cookies';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { UserHook } from '../hooks/index.js';
import { cookieOpts } from '../utils/cookie.js';
import { SessionAuthResponseLocalsSchema } from '../utils/locals.js';

const SendCodeRequstSchema = z.object({
  method: z.literal('POST'),
  body: z.object({ email: z.string() })
});

export const sendCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedReq = SendCodeRequstSchema.safeParse({
      method: req.method,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { email } = parsedReq.data.body;
    await WorkOSClient.sendCode(email);

    res.status(200).send({ success: true });
  } catch (err) {
    next(err);
  }
};

const VerifyCodeRequstSchema = z.object({
  method: z.literal('POST'),
  body: z.object({ email: z.string(), code: z.string() })
});

export const verifyCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedReq = VerifyCodeRequstSchema.safeParse({
      method: req.method,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { email, code } = parsedReq.data.body;
    const { session, user: workosUser } = await WorkOSClient.verifyCode(email, code);
    await UserHook.onUserAuthenticated(workosUser);

    const user = await UserService.getUserByEmail(email);
    if (!user) {
      throw new Error('User not in database after verification');
    }

    const { workos_user_id, deleted_at, ...rest } = user;
    const userObject: UserObject = {
      object: 'user',
      ...rest
    };

    res.cookie(SESSION_COOKIE_KEY, session, cookieOpts);
    res.status(200).send(userObject);
  } catch (err) {
    next(err);
  }
};

const GetInvitationByTokenRequstSchema = z.object({
  method: z.literal('GET'),
  query: z.object({ invitation_token: z.string() })
});

export const getInvitationByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedReq = GetInvitationByTokenRequstSchema.safeParse({
      method: req.method,
      query: req.query
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { invitation_token } = parsedReq.data.query;
    const invitation = await WorkOSClient.findInvitationByToken(invitation_token);

    const invitationObject: InvitationObject = {
      object: 'invitation',
      id: invitation.id,
      email: invitation.email,
      state: invitation.state as InvitationState,
      token: invitation.token,
      accept_url: invitation.acceptInvitationUrl,
      expires_at: invitation.expiresAt,
      created_at: invitation.createdAt,
      updated_at: invitation.updatedAt
    };

    res.status(200).send(invitationObject);
  } catch (err) {
    next(err);
  }
};

const AcceptInvitationRequstSchema = z.object({
  method: z.literal('POST'),
  body: z.object({ invitation_id: z.string() })
});

export const acceptInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedReq = AcceptInvitationRequstSchema.safeParse({
      method: req.method,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { invitation_id } = parsedReq.data.body;
    const invitation = await WorkOSClient.acceptInvitation(invitation_id);
    await WorkOSClient.sendCode(invitation.email);

    res.status(200).send({ success: true });
  } catch (err) {
    next(err);
  }
};

const GetOauthUrlRequstSchema = z.object({
  method: z.literal('GET'),
  query: z.object({ provider: z.literal('google'), organization_id: z.string().optional() })
});

export const getOauthUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedReq = GetOauthUrlRequstSchema.safeParse({
      method: req.method,
      query: req.query
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { provider, organization_id } = parsedReq.data.query;
    let organizationId: string | undefined;

    if (organization_id) {
      const organization = await OrganizationService.getOrganizationById(organization_id);
      if (!organization) {
        throw HttpError.notFound(`Organization not found with ID: ${organization_id}`);
      }
      organizationId = organization.workos_organization_id;
    }

    const oauthUrl = WorkOSClient.getOAuthUrl({ provider, organizationId });
    res.status(200).send({ oauth_url: oauthUrl });
  } catch (err) {
    next(err);
  }
};

const OAuthCallbackRequstSchema = z.object({
  method: z.literal('GET'),
  query: z.object({ code: z.string() })
});

export const oauthCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedReq = OAuthCallbackRequstSchema.safeParse({
      method: req.method,
      query: req.query
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { code } = parsedReq.data.query;
    const { user, session } = await WorkOSClient.oauthCallback(code);
    await UserHook.onUserAuthenticated(user);

    res.cookie(SESSION_COOKIE_KEY, session, cookieOpts);
    res.redirect(envVars.DASHBOARD_URL);
  } catch (err) {
    next(err);
  }
};

const GetAuthenticatedUserRequstSchema = z.object({
  method: z.literal('GET'),
  locals: SessionAuthResponseLocalsSchema
});

export const getAuthenticatedUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedReq = GetAuthenticatedUserRequstSchema.safeParse({
      method: req.method,
      locals: res.locals
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { user } = parsedReq.data.locals;
    const { workos_user_id, deleted_at, ...rest } = user;
    const userObject: UserObject = {
      object: 'user',
      ...rest
    };

    res.status(200).send(userObject);
  } catch (err) {
    next(err);
  }
};

const SwitchOrganizationRequestSchema = z.object({
  method: z.literal('GET'),
  locals: SessionAuthResponseLocalsSchema,
  query: z.object({ organization_id: z.string() })
});

export const switchOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedReq = SwitchOrganizationRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      query: req.query
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization } = parsedReq.data.locals;
    const { organization_id } = parsedReq.data.query;

    if (organization.id === organization_id) {
      res.status(200).json({ success: true });
      return;
    }

    const targetOrganization = await OrganizationService.getOrganizationById(organization_id);
    if (!targetOrganization) {
      throw HttpError.notFound(`Organization not found with ID: ${organization_id}`);
    }

    const cookies = Cookies(req, res);
    const sessionCookie = cookies.get(SESSION_COOKIE_KEY);
    if (!sessionCookie) {
      throw HttpError.unauthorized('Session cookie not found');
    }

    if (!envVars.WORKOS_COOKIE_PASSWORD) {
      throw new Error('WORKOS_COOKIE_PASSWORD not set');
    }

    const session = WorkOSClient.loadSessionFromCookie(sessionCookie);
    const refreshResponse = await session.refresh({
      cookiePassword: envVars.WORKOS_COOKIE_PASSWORD,
      organizationId: targetOrganization.workos_organization_id
    });

    if (!refreshResponse.authenticated) {
      throw new Error('Failed to refresh session');
    } else if (!refreshResponse.sealedSession || !refreshResponse.session) {
      throw new Error('Missing session data from refresh response');
    }

    res.cookie(SESSION_COOKIE_KEY, refreshResponse.sealedSession, cookieOpts);
    res.status(200).send({ success: true });
  } catch (err) {
    next(err);
  }
};

const LogoutRequstSchema = z.object({
  method: z.literal('GET')
});

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedReq = LogoutRequstSchema.safeParse({
      method: req.method
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const cookies = Cookies(req, res);
    const sessionCookie = cookies.get(SESSION_COOKIE_KEY);
    if (!sessionCookie) {
      throw HttpError.unauthorized('Invalid session');
    }

    const session = WorkOSClient.loadSessionFromCookie(sessionCookie);
    const logoutUrl = await session.getLogoutUrl();

    res.clearCookie(SESSION_COOKIE_KEY, cookieOpts);
    res.redirect(logoutUrl);
  } catch (err) {
    next(err);
  }
};

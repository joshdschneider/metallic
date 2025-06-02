import { HttpError, ProjectService, SESSION_COOKIE_KEY, UserService, WorkOSClient } from '@metallichq/shared';
import { HttpStatusCode } from '@metallichq/types';
import Cookies from 'cookies';
import { NextFunction, Request, Response } from 'express';
import { cookieOpts } from '../utils/cookie.js';
import { ApiKeyAuthResponseLocalsSchema, SessionAuthResponseLocalsSchema } from '../utils/locals.js';
import { getProjectFromRequest } from '../utils/project.js';

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.get('authorization');
    if (!authHeader) {
      throw HttpError.unauthorized('Authorization header missing');
    }

    const apiKey = authHeader.split('Bearer ').pop();
    if (!apiKey) {
      throw HttpError.unauthorized('Malformed authorization header');
    }

    const project = await ProjectService.getProjectByApiKey(apiKey);
    if (!project) {
      throw HttpError.unauthorized('Invalid API key');
    }

    const { organization, ...rest } = project;
    res.locals['auth_method'] = 'api_key';
    res.locals['organization'] = organization;
    res.locals['project'] = rest;

    ApiKeyAuthResponseLocalsSchema.parse(res.locals);

    next();
  } catch (err) {
    next(err);
  }
};

export const sessionAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cookies = Cookies(req, res);
    const sessionCookie = cookies.get(SESSION_COOKIE_KEY);
    if (!sessionCookie) {
      throw HttpError.unauthorized('Session cookie not found');
    }

    const session = WorkOSClient.loadSessionFromCookie(sessionCookie);
    const authResponse = await session.authenticate();

    let email: string;
    let organizationId: string | undefined;

    if (authResponse.authenticated) {
      email = authResponse.user.email;
      organizationId = authResponse.organizationId;
    } else {
      const refreshResponse = await session.refresh();
      if (!refreshResponse.authenticated) {
        res.clearCookie(SESSION_COOKIE_KEY);
        res.status(HttpStatusCode.Unauthorized).json({
          name: 'UnauthorizedError',
          message: 'Session expired'
        });
        return;
      } else if (!refreshResponse.sealedSession || !refreshResponse.session) {
        throw new Error('Missing session data from refresh response');
      } else {
        email = refreshResponse.session.user.email;
        organizationId = refreshResponse.session.organizationId;
        res.cookie(SESSION_COOKIE_KEY, refreshResponse.sealedSession, cookieOpts);
      }
    }

    const user = await UserService.getUserByEmail(email);
    if (!user) {
      throw HttpError.unauthorized('User not found');
    }

    const [userAccount, project] = await Promise.all([
      UserService.getUserAccount(user.id, {
        organizationIdFromCookie: organizationId,
        organizationIdFromQueryParams: req.query['organization_id'] as string | undefined
      }),
      getProjectFromRequest(req)
    ]);

    if (!userAccount) {
      throw HttpError.unauthorized('Account not found');
    }

    const { organization, membership } = userAccount;
    res.locals['user'] = user;
    res.locals['organization'] = organization;
    res.locals['organization_membership'] = membership;
    res.locals['project'] = project;
    res.locals['auth_method'] = 'session';

    SessionAuthResponseLocalsSchema.parse(res.locals);

    next();
  } catch (err) {
    next(err);
  }
};

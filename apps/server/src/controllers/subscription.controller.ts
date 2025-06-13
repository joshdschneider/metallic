import { BillingService, HttpError, StripeClient } from '@metallichq/shared';
import { Subscription, SubscriptionObject } from '@metallichq/types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ResponseLocalsSchema } from '../utils/locals.js';

const ListSubscriptionsRequestSchema = z.object({
  method: z.literal('GET'),
  locals: ResponseLocalsSchema
});

export const listSubscriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = ListSubscriptionsRequestSchema.safeParse({
      method: req.method,
      locals: res.locals
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization } = parsedReq.data.locals;
    const subscriptions = await BillingService.getSubscriptionsByOrganizationId(organization.id);

    const subscriptionObjects: SubscriptionObject[] = subscriptions.map((subscription) => {
      return {
        object: 'subscription',
        id: subscription.id,
        organization_id: subscription.organization_id,
        plan: subscription.plan,
        status: subscription.status,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at
      };
    });

    res.status(200).json({
      object: 'list',
      data: subscriptionObjects
    });
  } catch (err) {
    next(err);
  }
};

const CreateSubscriptionRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  body: z.object({ plan: z.enum(['developer', 'team']) })
});

export const createSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = CreateSubscriptionRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization } = parsedReq.data.locals;
    const { plan } = parsedReq.data.body;
    if (!organization.stripe_customer_id) {
      throw new Error('Organization does not have a stripe customer id');
    }

    const stripeSubscription = await StripeClient.createSubscription(organization.stripe_customer_id, plan);
    const subscription = await BillingService.createSubscription({
      organization_id: organization.id,
      stripe_subscription_id: stripeSubscription.id,
      plan,
      status: stripeSubscription.status
    });

    const subscriptionObject: SubscriptionObject & {
      confirmation_secret?: string;
    } = {
      object: 'subscription',
      id: subscription.id,
      organization_id: subscription.organization_id,
      plan: subscription.plan,
      status: subscription.status,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
      confirmation_secret: stripeSubscription.confirmation_secret
    };

    res.status(201).json(subscriptionObject);
  } catch (err) {
    next(err);
  }
};

export const UpgradeSubscriptionRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  body: z.object({ plan: z.enum(['developer', 'team']) })
});

export const upgradeSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = UpgradeSubscriptionRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization } = parsedReq.data.locals;
    if (!organization.stripe_customer_id) {
      throw new Error('Organization does not have a stripe customer id');
    }

    const [paymentMethods, subscriptions] = await Promise.all([
      BillingService.getPaymentMethodsByOrganizationId(organization.id),
      BillingService.getSubscriptionsByOrganizationId(organization.id)
    ]);

    if (paymentMethods.length === 0) {
      throw HttpError.badRequest('Please add a payment method');
    }

    const { plan } = parsedReq.data.body;
    let subscription: Subscription;

    if (subscriptions.length === 0) {
      const stripeSubscription = await StripeClient.createSubscription(organization.stripe_customer_id, plan);
      subscription = await BillingService.createSubscription({
        organization_id: organization.id,
        stripe_subscription_id: stripeSubscription.id,
        plan,
        status: stripeSubscription.status
      });
    } else {
      const activeDevSubscription = subscriptions.find((sub) => sub.status === 'active' && sub.plan === 'developer');
      if (!activeDevSubscription) {
        throw new Error('Invalid plan upgrade');
      }

      await StripeClient.upgradeToTeamPlan(activeDevSubscription.stripe_subscription_id);
      subscription = await BillingService.updateSubscription(activeDevSubscription.id, { plan: 'team' });
    }

    const subscriptionObject: SubscriptionObject = {
      object: 'subscription',
      id: subscription.id,
      organization_id: subscription.organization_id,
      plan: subscription.plan,
      status: subscription.status,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at
    };

    res.status(200).json(subscriptionObject);
  } catch (err) {
    next(err);
  }
};

export const DowngradeSubscriptionRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  body: z.object({ plan: z.enum(['free', 'developer']) })
});

export const downgradeSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = DowngradeSubscriptionRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization } = parsedReq.data.locals;
    if (!organization.stripe_customer_id) {
      throw new Error('Organization does not have a stripe customer id');
    }

    const subscriptions = await BillingService.getSubscriptionsByOrganizationId(organization.id);
    const activeSubscription = subscriptions.find((sub) => sub.status === 'active');
    if (!activeSubscription) {
      throw HttpError.forbidden('Organization does not have an active subscription');
    }

    let subscription: Subscription;
    const { plan } = parsedReq.data.body;
    if (plan === 'free') {
      const canceledSubscription = await StripeClient.cancelSubscription(activeSubscription.stripe_subscription_id);
      subscription = await BillingService.updateSubscription(activeSubscription.id, {
        status: canceledSubscription.status
      });
    } else if (plan === 'developer') {
      await StripeClient.downgradeToDeveloperPlan(activeSubscription.stripe_subscription_id);
      subscription = await BillingService.updateSubscription(activeSubscription.id, { plan });
    } else {
      throw HttpError.badRequest('Invalid plan');
    }

    const subscriptionObject: SubscriptionObject = {
      object: 'subscription',
      id: subscription.id,
      organization_id: subscription.organization_id,
      plan: subscription.plan,
      status: subscription.status,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at
    };

    res.status(200).json(subscriptionObject);
  } catch (err) {
    next(err);
  }
};

export const CancelSubscriptionRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  body: z.object({ subscription_id: z.string() })
});

export const cancelSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = CancelSubscriptionRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { subscription_id } = parsedReq.data.body;
    const subscription = await BillingService.getSubscriptionById(subscription_id);
    if (!subscription) {
      throw HttpError.notFound('Subscription not found');
    } else if (subscription.status !== 'active') {
      throw HttpError.forbidden('Subscription is not active');
    }

    const canceledSubscription = await StripeClient.cancelSubscription(subscription.stripe_subscription_id);
    const updatedSubscription = await BillingService.updateSubscription(subscription.id, {
      status: canceledSubscription.status
    });

    const subscriptionObject: SubscriptionObject = {
      object: 'subscription',
      id: updatedSubscription.id,
      organization_id: updatedSubscription.organization_id,
      plan: updatedSubscription.plan,
      status: updatedSubscription.status,
      created_at: updatedSubscription.created_at,
      updated_at: updatedSubscription.updated_at
    };

    res.status(200).json(subscriptionObject);
  } catch (err) {
    next(err);
  }
};

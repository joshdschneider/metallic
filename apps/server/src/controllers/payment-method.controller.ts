import { BillingService, HttpError, OrganizationService, StripeClient, UserService } from '@metallichq/shared';
import { PaymentMethodDeletedObject, PaymentMethodObject } from '@metallichq/types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ResponseLocalsSchema } from '../utils/locals.js';

export const ListPaymentMethodsRequestSchema = z.object({
  method: z.literal('GET'),
  locals: ResponseLocalsSchema
});

export const listPaymentMethods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = ListPaymentMethodsRequestSchema.safeParse({
      method: req.method,
      locals: res.locals
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization } = parsedReq.data.locals;
    const paymentMethods = await BillingService.getPaymentMethodsByOrganizationId(organization.id);

    const paymentMethodObjects: PaymentMethodObject[] = paymentMethods.map((paymentMethod) => {
      return {
        object: 'payment_method',
        id: paymentMethod.id,
        organization_id: paymentMethod.organization_id,
        type: paymentMethod.type,
        is_default: paymentMethod.is_default,
        card_brand: paymentMethod.card_brand,
        card_last4: paymentMethod.card_last4,
        card_exp_month: paymentMethod.card_exp_month,
        card_exp_year: paymentMethod.card_exp_year,
        created_at: paymentMethod.created_at,
        updated_at: paymentMethod.updated_at
      };
    });

    res.status(200).json({ object: 'list', data: paymentMethodObjects });
  } catch (err) {
    next(err);
  }
};

export const SetupPaymentMethodRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema
});

export const setupPaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = SetupPaymentMethodRequestSchema.safeParse({
      method: req.method,
      locals: res.locals
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    let stripeCustomer;
    const { organization } = parsedReq.data.locals;

    if (organization.stripe_customer_id) {
      const customer = await StripeClient.getCustomer(organization.stripe_customer_id);
      if (customer) {
        stripeCustomer = customer;
      }
    }

    if (!stripeCustomer) {
      const memberships = await OrganizationService.getOrganizationMembershipsByOrganizationId(organization.id);
      const owner = memberships.find((membership) => membership.role === 'owner');
      if (!owner) {
        throw HttpError.forbidden('Organization does not have an owner');
      }

      const user = await UserService.getUserById(owner.user_id);
      if (!user) {
        throw HttpError.forbidden('Organization does not have an owner');
      }

      const customer = await StripeClient.createCustomer({
        organizationId: organization.id,
        organizationName: organization.name,
        organizationOwnerEmail: user.email
      });

      await OrganizationService.updateOrganization(organization.id, { stripe_customer_id: customer.id });
      stripeCustomer = customer;
    }

    const setupIntent = await StripeClient.addPaymentMethod(stripeCustomer.id);

    res.status(200).json({
      object: 'setup_intent',
      client_secret: setupIntent.client_secret
    });
  } catch (err) {
    next(err);
  }
};

export const AddPaymentMethodRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  body: z.object({
    stripe_payment_method_id: z.string(),
    make_default: z.boolean().optional()
  })
});

export const addPaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = AddPaymentMethodRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { stripe_payment_method_id, make_default } = parsedReq.data.body;
    const { organization } = parsedReq.data.locals;
    if (!organization.stripe_customer_id) {
      throw new Error('Organization does not have a stripe customer id');
    }

    const stripePaymentMethod = await StripeClient.attachPaymentMethod(
      organization.stripe_customer_id,
      stripe_payment_method_id
    );

    const paymentMethod = await BillingService.createPaymentMethod({
      organization_id: organization.id,
      stripe_payment_method_id: stripePaymentMethod.id,
      type: stripePaymentMethod.type,
      card_brand: stripePaymentMethod.card?.brand ?? null,
      card_last4: stripePaymentMethod.card?.last4 ?? null,
      card_exp_month: stripePaymentMethod.card?.exp_month ?? null,
      card_exp_year: stripePaymentMethod.card?.exp_year ?? null,
      is_default: false
    });

    if (make_default) {
      await StripeClient.makePaymentMethodDefault(organization.stripe_customer_id, stripePaymentMethod.id);
      await BillingService.makePaymentMethodDefault(paymentMethod.id);
    }

    const paymentMethodObject: PaymentMethodObject = {
      object: 'payment_method',
      id: paymentMethod.id,
      organization_id: paymentMethod.organization_id,
      type: paymentMethod.type,
      is_default: paymentMethod.is_default,
      card_brand: paymentMethod.card_brand,
      card_last4: paymentMethod.card_last4,
      card_exp_month: paymentMethod.card_exp_month,
      card_exp_year: paymentMethod.card_exp_year,
      created_at: paymentMethod.created_at,
      updated_at: paymentMethod.updated_at
    };

    res.status(200).json(paymentMethodObject);
  } catch (err) {
    next(err);
  }
};

export const MakePaymentMethodDefaultRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  body: z.object({ payment_method_id: z.string() })
});

export const makePaymentMethodDefault = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = MakePaymentMethodDefaultRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization } = parsedReq.data.locals;
    const { payment_method_id } = parsedReq.data.body;
    if (!organization.stripe_customer_id) {
      throw new Error('Organization does not have a stripe customer id');
    }

    const paymentMethod = await BillingService.getPaymentMethodById(payment_method_id);
    if (!paymentMethod) {
      throw HttpError.notFound('Payment method not found');
    }

    await StripeClient.makePaymentMethodDefault(
      organization.stripe_customer_id,
      paymentMethod.stripe_payment_method_id
    );
    const updatedPaymentMethod = await BillingService.updatePaymentMethod(paymentMethod.id, {
      is_default: true
    });

    const paymentMethodObject: PaymentMethodObject = {
      object: 'payment_method',
      id: updatedPaymentMethod.id,
      organization_id: updatedPaymentMethod.organization_id,
      type: updatedPaymentMethod.type,
      is_default: updatedPaymentMethod.is_default,
      card_brand: updatedPaymentMethod.card_brand,
      card_last4: updatedPaymentMethod.card_last4,
      card_exp_month: updatedPaymentMethod.card_exp_month,
      card_exp_year: updatedPaymentMethod.card_exp_year,
      created_at: updatedPaymentMethod.created_at,
      updated_at: updatedPaymentMethod.updated_at
    };

    res.status(200).json(paymentMethodObject);
  } catch (err) {
    next(err);
  }
};

export const RemovePaymentMethodRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  body: z.object({ payment_method_id: z.string() })
});

export const removePaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = RemovePaymentMethodRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { payment_method_id } = parsedReq.data.body;
    const paymentMethod = await BillingService.getPaymentMethodById(payment_method_id);
    if (!paymentMethod) {
      throw HttpError.notFound('Payment method not found');
    } else if (paymentMethod.is_default) {
      throw HttpError.forbidden('Cannot remove default payment method');
    }

    await StripeClient.removePaymentMethod(paymentMethod.stripe_payment_method_id);
    await BillingService.deletePaymentMethod(paymentMethod.id);

    const paymentMethodDeletedObject: PaymentMethodDeletedObject = {
      object: 'payment_method',
      id: paymentMethod.id,
      deleted: true
    };

    res.status(200).json(paymentMethodDeletedObject);
  } catch (err) {
    next(err);
  }
};

import { database } from '@metallichq/database';
import { SubscriptionPlan } from '@metallichq/types';
import Stripe from 'stripe';
import { STRIPE_PLAN_ITEMS, STRIPE_PRICE_MAP } from '../utils/constants.js';
import { envVars } from '../utils/env-vars.js';
import { captureException } from '../utils/error.js';

const stripe = new Stripe(envVars.STRIPE_SECRET_KEY);

export const getCustomer = async (stripeCustomerId: string): Promise<Stripe.Customer | null> => {
  try {
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    return customer.deleted ? null : customer;
  } catch {
    return null;
  }
};

interface CreateCustomerRequest {
  organizationId: string;
  organizationName: string | null;
  organizationOwnerEmail: string;
}

export const createCustomer = async ({
  organizationId,
  organizationName,
  organizationOwnerEmail
}: CreateCustomerRequest): Promise<Stripe.Customer> => {
  return await stripe.customers.create({
    name: organizationName ?? undefined,
    email: organizationOwnerEmail,
    metadata: { metallic_organization_id: organizationId }
  });
};

export const deleteCustomer = async (stripeCustomerId: string): Promise<void> => {
  await stripe.customers.del(stripeCustomerId);
};

export const createSubscription = async (
  stripeCustomerId: string,
  plan: SubscriptionPlan
): Promise<Stripe.Subscription & { confirmation_secret?: string }> => {
  const items = STRIPE_PLAN_ITEMS[plan];
  if (!items) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items,
    collection_method: 'charge_automatically',
    proration_behavior: 'create_prorations',
    expand: ['latest_invoice']
  });

  const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
  const confirmationSecret = latestInvoice.confirmation_secret?.client_secret;
  return { ...subscription, confirmation_secret: confirmationSecret };
};

export const getSubscription = async (stripeSubscriptionId: string): Promise<Stripe.Subscription> => {
  return await stripe.subscriptions.retrieve(stripeSubscriptionId);
};

export const cancelSubscription = async (stripeSubscriptionId: string): Promise<Stripe.Subscription> => {
  return await stripe.subscriptions.cancel(stripeSubscriptionId);
};

export const upgradeToTeamPlan = async (stripeSubscriptionId: string): Promise<void> => {
  const subscription = await getSubscription(stripeSubscriptionId);
  const devItem = subscription.items.data.find((item) => item.price.id === STRIPE_PRICE_MAP['developer_license']);
  if (!devItem) {
    throw new Error('Developer license not found');
  }

  await stripe.subscriptions.update(subscription.id, {
    items: [{ id: devItem.id, price: STRIPE_PRICE_MAP['team_license'] }],
    billing_cycle_anchor: 'now',
    proration_behavior: 'create_prorations'
  });
};

export const downgradeToDeveloperPlan = async (stripeSubscriptionId: string): Promise<void> => {
  const subscription = await getSubscription(stripeSubscriptionId);
  const teamItem = subscription.items.data.find((item) => item.price.id === STRIPE_PRICE_MAP['team_license']);
  if (!teamItem) {
    throw new Error('Team license not found');
  }

  await stripe.subscriptionItems.update(teamItem.id, { price: STRIPE_PRICE_MAP['developer_license'] });
};

export const listPaymentMethods = async (stripeCustomerId: string): Promise<Stripe.PaymentMethod[]> => {
  const paymentMethods = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: 'card' });
  return paymentMethods.data;
};

export const getPaymentMethod = async (stripePaymentMethodId: string): Promise<Stripe.PaymentMethod> => {
  return await stripe.paymentMethods.retrieve(stripePaymentMethodId);
};

export const attachPaymentMethod = async (
  stripeCustomerId: string,
  stripePaymentMethodId: string
): Promise<Stripe.PaymentMethod> => {
  return await stripe.paymentMethods.attach(stripePaymentMethodId, {
    customer: stripeCustomerId
  });
};

export const addPaymentMethod = async (stripeCustomerId: string): Promise<Stripe.SetupIntent> => {
  return await stripe.setupIntents.create({
    customer: stripeCustomerId,
    payment_method_types: ['card']
  });
};

export const makePaymentMethodDefault = async (
  stripeCustomerId: string,
  stripePaymentMethodId: string
): Promise<void> => {
  await stripe.customers.update(stripeCustomerId, {
    invoice_settings: { default_payment_method: stripePaymentMethodId }
  });
};

export const removePaymentMethod = async (stripePaymentMethodId: string): Promise<void> => {
  await stripe.paymentMethods.detach(stripePaymentMethodId);
};

interface ReportComputeUsageRequest {
  stripeCustomerId: string;
  instanceType: string;
  computeSeconds: number;
  timestamp: number; // Unix timestamp
}

export const reportComputeUsage = async (req: ReportComputeUsageRequest): Promise<void> => {
  await stripe.billing.meterEvents.create({
    event_name: `compute_seconds.${req.instanceType.replaceAll('-', '_')}`,
    timestamp: req.timestamp,
    payload: {
      value: req.computeSeconds.toString(),
      stripe_customer_id: req.stripeCustomerId
    }
  });
};

interface ReportStorageUsageRequest {
  stripeCustomerId: string;
  storageGbSeconds: number;
  timestamp: number; // Unix timestamp
}

export const reportStorageUsage = async (req: ReportStorageUsageRequest): Promise<void> => {
  await stripe.billing.meterEvents.create({
    event_name: 'storage_gb_seconds',
    timestamp: req.timestamp,
    payload: {
      value: req.storageGbSeconds.toString(),
      stripe_customer_id: req.stripeCustomerId
    }
  });
};

export const listInvoices = async (stripeCustomerId: string): Promise<Stripe.Invoice[]> => {
  const invoices = await stripe.invoices.list({ customer: stripeCustomerId, limit: 10 });
  return invoices.data;
};

export const constructWebhookEvent = (body: any, signature: string | string[]): Stripe.Event => {
  return stripe.webhooks.constructEvent(body, signature, envVars.STRIPE_WEBHOOK_SECRET);
};

export const handleInvoicePaid = async (invoice: Stripe.Invoice): Promise<void> => {
  if (invoice.parent && invoice.parent.type === 'subscription_details') {
    const subscriptionId = invoice.parent.subscription_details?.subscription;
    if (subscriptionId && typeof subscriptionId === 'string') {
      try {
        const subscription = await getSubscription(subscriptionId);
        await database.subscription.updateMany({
          where: { stripe_subscription_id: subscription.id, deleted_at: null },
          data: { status: subscription.status }
        });
      } catch (err) {
        captureException(err);
      }
    }
  }
};

export const handleInvoicePaymentFailure = async (invoice: Stripe.Invoice): Promise<void> => {
  captureException(new Error(`Invoice payment failed! Stripe invoice ID: ${invoice.id}`));
  if (invoice.parent && invoice.parent.type === 'subscription_details') {
    const subscriptionId = invoice.parent.subscription_details?.subscription;
    if (subscriptionId && typeof subscriptionId === 'string') {
      try {
        const subscription = await getSubscription(subscriptionId);
        await database.subscription.updateMany({
          where: { stripe_subscription_id: subscription.id, deleted_at: null },
          data: { status: subscription.status }
        });
      } catch (err) {
        captureException(err);
      }
    }
  }
};

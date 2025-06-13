import { database } from '@metallichq/database';
import {
  Computer,
  ComputerEvent,
  Organization,
  PaymentMethod,
  PaymentMethodSchema,
  Subscription,
  SubscriptionPlan,
  SubscriptionSchema,
  Template,
  UsageRecord,
  UsageRecordSchema
} from '@metallichq/types';
import { z } from 'zod';
import { StripeClient } from '../clients/index.js';
import { generateId, now, Resource, toUnix } from '../utils/index.js';

export const getSubscriptionsByOrganizationId = async (organizationId: string): Promise<Subscription[]> => {
  const subscriptions = await database.subscription.findMany({
    where: { organization_id: organizationId, deleted_at: null }
  });

  return z.array(SubscriptionSchema).parse(subscriptions);
};

export const getSubscriptionById = async (subscriptionId: string): Promise<Subscription | null> => {
  const subscription = await database.subscription.findUnique({
    where: { id: subscriptionId, deleted_at: null }
  });

  return subscription ? SubscriptionSchema.parse(subscription) : null;
};

export const createSubscription = async (
  subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Subscription> => {
  const newSubscription = await database.subscription.create({
    data: {
      ...subscription,
      id: generateId(Resource.Subscription),
      created_at: now(),
      updated_at: now(),
      deleted_at: null
    }
  });

  return SubscriptionSchema.parse(newSubscription);
};

export const updateSubscription = async (
  subscriptionId: string,
  data: Partial<Subscription>
): Promise<Subscription> => {
  const updatedSubscription = await database.subscription.update({
    where: { id: subscriptionId, deleted_at: null },
    data: { ...data, updated_at: now() }
  });

  return SubscriptionSchema.parse(updatedSubscription);
};

export const deleteSubscription = async (subscriptionId: string): Promise<void> => {
  await database.subscription.update({
    where: { id: subscriptionId, deleted_at: null },
    data: { deleted_at: now() }
  });
};

export const getPaymentMethodsByOrganizationId = async (organizationId: string): Promise<PaymentMethod[]> => {
  const paymentMethods = await database.paymentMethod.findMany({
    where: { organization_id: organizationId, deleted_at: null }
  });

  return z.array(PaymentMethodSchema).parse(paymentMethods);
};

export const getPaymentMethodById = async (paymentMethodId: string): Promise<PaymentMethod | null> => {
  const paymentMethod = await database.paymentMethod.findUnique({
    where: { id: paymentMethodId, deleted_at: null }
  });

  return paymentMethod ? PaymentMethodSchema.parse(paymentMethod) : null;
};

export const createPaymentMethod = async (
  paymentMethod: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<PaymentMethod> => {
  const newPaymentMethod = await database.paymentMethod.create({
    data: {
      ...paymentMethod,
      id: generateId(Resource.PaymentMethod),
      created_at: now(),
      updated_at: now(),
      deleted_at: null
    }
  });

  return PaymentMethodSchema.parse(newPaymentMethod);
};

export const updatePaymentMethod = async (
  paymentMethodId: string,
  data: Partial<PaymentMethod>
): Promise<PaymentMethod> => {
  const updatedPaymentMethod = await database.paymentMethod.update({
    where: { id: paymentMethodId, deleted_at: null },
    data: { ...data, updated_at: now() }
  });

  return PaymentMethodSchema.parse(updatedPaymentMethod);
};

export const deletePaymentMethod = async (paymentMethodId: string): Promise<void> => {
  await database.paymentMethod.update({
    where: { id: paymentMethodId, deleted_at: null },
    data: { deleted_at: now() }
  });
};

export const makePaymentMethodDefault = async (paymentMethodId: string): Promise<void> => {
  const paymentMethod = await database.paymentMethod.update({
    where: { id: paymentMethodId, deleted_at: null },
    data: { is_default: true }
  });

  await database.paymentMethod.updateMany({
    where: {
      organization_id: paymentMethod.organization_id,
      id: { not: paymentMethodId },
      deleted_at: null
    },
    data: { is_default: false }
  });
};

export const createComputeUsageRecord = async (usageRecord: {
  computerId: string;
  instanceType: string;
  value: number;
  timestamp: number;
}): Promise<UsageRecord> => {
  const eventName = `compute_seconds.${usageRecord.instanceType.replaceAll('-', '_')}`;
  const newUsageRecord = await database.usageRecord.create({
    data: {
      id: generateId(Resource.UsageRecord),
      computer_id: usageRecord.computerId,
      event_name: eventName,
      value: usageRecord.value,
      timestamp: usageRecord.timestamp
    }
  });
  return UsageRecordSchema.parse(newUsageRecord);
};

export const createStorageUsageRecord = async (usageRecord: {
  computerId: string;
  value: number;
  timestamp: number;
}): Promise<UsageRecord> => {
  const newUsageRecord = await database.usageRecord.create({
    data: {
      id: generateId(Resource.UsageRecord),
      computer_id: usageRecord.computerId,
      event_name: 'storage_gb_seconds',
      value: usageRecord.value,
      timestamp: usageRecord.timestamp
    }
  });
  return UsageRecordSchema.parse(newUsageRecord);
};

const COMPUTE_START_EVENTS = new Set<ComputerEvent['type']>(['starting', 'started']);

const COMPUTE_STOP_EVENTS = new Set<ComputerEvent['type']>(['stopping', 'stopped', 'destroying', 'destroyed']);

export const calculateAndReportUsage = async (
  organization: Organization,
  computer: Computer & {
    template: Template;
    events: ComputerEvent[];
    usage_records: UsageRecord[];
  }
): Promise<void> => {
  const stripeCustomerId = organization.stripe_customer_id;
  const instanceType = computer.template.instance_type;
  const storageGb = computer.template.storage_gb; // + rootfs size

  const lastComputeTimestamp = computer.usage_records
    .filter((r) => r.event_name.startsWith('compute_seconds'))
    .reduce<number>((max, r) => Math.max(max, r.timestamp), 0);

  const lastStorageTimestamp = computer.usage_records
    .filter((r) => r.event_name === 'storage_gb_seconds')
    .reduce<number>((max, r) => Math.max(max, r.timestamp), 0);

  const eventsSorted = [...computer.events].sort((a, b) => a.timestamp - b.timestamp);

  // Compute usage calculation
  let computeSecondsDelta = 0;
  let computeActive = false; // running flag
  let cursor: number | null = null; // timestamp of *previous* event we have processed

  for (const evt of eventsSorted) {
    if (cursor !== null) {
      // [cursor, evt.timestamp) is the wall‑clock interval we are traversing
      if (computeActive && evt.timestamp > lastComputeTimestamp) {
        const intervalStart = Math.max(cursor, lastComputeTimestamp);
        computeSecondsDelta += evt.timestamp - intervalStart;
      }
    }

    // Transition the FSM
    if (COMPUTE_START_EVENTS.has(evt.type)) {
      computeActive = true;
    } else if (COMPUTE_STOP_EVENTS.has(evt.type)) {
      computeActive = false;
    }

    cursor = evt.timestamp;
  }

  // Handle open interval that stretches to now
  const now = Math.floor(Date.now() / 1000);
  if (computeActive && cursor !== null && now > lastComputeTimestamp) {
    const intervalStart = Math.max(cursor, lastComputeTimestamp);
    computeSecondsDelta += now - intervalStart;
  }

  // Storage usage calculation
  const storageStart = toUnix(computer.created_at);
  const destroyedEvent = eventsSorted.find((e) => e.type === 'destroyed');
  const storageEnd = computer.deleted_at ? toUnix(computer.deleted_at) : (destroyedEvent?.timestamp ?? now);

  let storageSecondsDelta = 0;
  if (storageEnd > lastStorageTimestamp) {
    const intervalStart = Math.max(storageStart, lastStorageTimestamp);
    storageSecondsDelta = storageEnd - intervalStart;
  }

  const storageGbSecondsDelta = storageSecondsDelta * storageGb;

  // Push deltas to database and Stripe (if any)
  if (computeSecondsDelta > 0) {
    const usageRecord = await createComputeUsageRecord({
      computerId: computer.id,
      instanceType,
      value: computeSecondsDelta,
      timestamp: now
    });

    if (stripeCustomerId) {
      await StripeClient.reportComputeUsage({
        stripeCustomerId,
        instanceType,
        computeSeconds: usageRecord.value,
        timestamp: usageRecord.timestamp
      });
    }
  }

  if (storageGbSecondsDelta > 0) {
    const usageRecord = await createStorageUsageRecord({
      computerId: computer.id,
      value: storageGbSecondsDelta,
      timestamp: now
    });

    if (stripeCustomerId) {
      await StripeClient.reportStorageUsage({
        stripeCustomerId,
        storageGbSeconds: usageRecord.value,
        timestamp: usageRecord.timestamp
      });
    }
  }
};

export const getPlanFromSubscriptions = (subscriptions: Subscription[]): SubscriptionPlan => {
  if (subscriptions.length === 0) {
    return 'free';
  }

  const activeSubscription = subscriptions.find((s) => s.status === 'active');
  if (activeSubscription) {
    return activeSubscription.plan;
  }

  const pastDueOrTrialingSubscription = subscriptions.find((s) => ['past_due', 'trialing'].includes(s.status));
  if (pastDueOrTrialingSubscription) {
    return pastDueOrTrialingSubscription.plan;
  }

  return 'free';
};

export const countComputeHoursThisMonth = async (organizationId: string): Promise<number> => {
  const organization = await database.organization.findUnique({
    where: { id: organizationId, deleted_at: null },
    include: { projects: { include: { computers: { include: { usage_records: true } } } } }
  });

  if (!organization) {
    throw new Error('Organization not found');
  }

  const computers = organization.projects.flatMap((p) => p.computers);
  const computeUsageRecords = computers.flatMap((c) =>
    c.usage_records.filter((r) => r.event_name.startsWith('compute_seconds.'))
  );

  const totalSeconds = computeUsageRecords.reduce<number>((sum, r) => sum + r.value, 0);
  return Math.floor(totalSeconds / 3600);
};

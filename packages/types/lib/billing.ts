import { z } from 'zod';

export const SubscriptionPlanSchema = z.enum(['free', 'developer', 'team', 'enterprise']);

export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

export const SubscriptionSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  stripe_subscription_id: z.string(),
  plan: SubscriptionPlanSchema,
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable()
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

export type SubscriptionObject = {
  object: 'subscription';
  id: string;
  organization_id: string;
  plan: SubscriptionPlan;
  status: string;
  created_at: string;
  updated_at: string;
};

export const PaymentMethodSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  stripe_payment_method_id: z.string(),
  type: z.string(),
  is_default: z.boolean(),
  card_brand: z.string().nullable(),
  card_last4: z.string().nullable(),
  card_exp_month: z.number().nullable(),
  card_exp_year: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable()
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export type PaymentMethodObject = {
  object: 'payment_method';
  id: string;
  organization_id: string;
  type: string;
  is_default: boolean;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  created_at: string;
  updated_at: string;
};

export type PaymentMethodDeletedObject = {
  object: 'payment_method';
  id: string;
  deleted: true;
};

export type InvoiceObject = {
  object: 'invoice';
  organization_id: string;
  download_url: string | null;
  hosted_url: string | null;
  status: string | null;
  total: number;
  period_start: string;
  period_end: string;
};

export const UsageRecordSchema = z.object({
  id: z.string(),
  computer_id: z.string(),
  event_name: z.string(),
  value: z.number(),
  timestamp: z.number()
});

export type UsageRecord = z.infer<typeof UsageRecordSchema>;

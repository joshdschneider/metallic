import { SubscriptionObject } from '@metallichq/types';
import { api } from './api';

interface CreateSubscriptionRequest {
  plan: 'developer' | 'team';
}

export const createSubscription = async (
  organizationId: string,
  { plan }: CreateSubscriptionRequest
): Promise<SubscriptionObject & { confirmation_secret?: string }> => {
  const response = await api.post<SubscriptionObject & { confirmation_secret?: string }>(
    `/web/organizations/${organizationId}/subscriptions`,
    { plan }
  );
  return response.data;
};

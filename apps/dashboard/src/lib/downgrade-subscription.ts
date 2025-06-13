import { SubscriptionObject } from '@metallichq/types';
import { api } from './api';

interface DowngradeSubscriptionRequest {
  plan: 'free' | 'developer';
}

export const downgradeSubscription = async (
  organizationId: string,
  { plan }: DowngradeSubscriptionRequest
): Promise<SubscriptionObject> => {
  const response = await api.post<SubscriptionObject>(`/web/organizations/${organizationId}/subscriptions/downgrade`, {
    plan
  });
  return response.data;
};

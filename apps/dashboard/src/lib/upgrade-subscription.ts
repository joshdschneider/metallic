import { SubscriptionObject } from '@metallichq/types';
import { api } from './api';

interface UpgradeSubscriptionRequest {
  plan: 'developer' | 'team';
}

export const upgradeSubscription = async (
  organizationId: string,
  { plan }: UpgradeSubscriptionRequest
): Promise<SubscriptionObject> => {
  const response = await api.post<SubscriptionObject>(`/web/organizations/${organizationId}/subscriptions/upgrade`, {
    plan
  });
  return response.data;
};

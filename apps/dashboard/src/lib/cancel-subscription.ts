import { SubscriptionObject } from '@metallichq/types';
import { api } from './api';

export const cancelSubscription = async (organizationId: string): Promise<SubscriptionObject> => {
  const response = await api.post<SubscriptionObject>(`/web/organizations/${organizationId}/subscriptions/cancel`);
  return response.data;
};

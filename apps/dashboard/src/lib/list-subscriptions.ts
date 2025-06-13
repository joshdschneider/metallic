import { SubscriptionObject } from '@metallichq/types';
import { api } from './api';

export const listSubscriptions = async (organizationId: string) => {
  const response = await api.get<{ object: 'list'; data: SubscriptionObject[] }>(
    `/web/organizations/${organizationId}/subscriptions`
  );
  return response.data;
};

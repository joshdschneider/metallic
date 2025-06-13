import { api } from './api';

export const setupPaymentMethod = async (organizationId: string) => {
  const response = await api.post<{
    object: 'setup_intent';
    client_secret: string;
  }>(`/web/organizations/${organizationId}/payment-methods/setup`);
  return response.data;
};

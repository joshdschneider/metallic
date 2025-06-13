import { PaymentMethodObject } from '@metallichq/types';
import { api } from './api';

export const listPaymentMethods = async (organizationId: string) => {
  const response = await api.get<{ object: 'list'; data: PaymentMethodObject[] }>(
    `/web/organizations/${organizationId}/payment-methods`
  );
  return response.data;
};

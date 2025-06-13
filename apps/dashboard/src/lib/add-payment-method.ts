import { PaymentMethodObject } from '@metallichq/types';
import { api } from './api';

interface AddPaymentMethodRequest {
  stripe_payment_method_id: string;
  make_default: boolean;
}

export const addPaymentMethod = async (
  organizationId: string,
  { stripe_payment_method_id, make_default }: AddPaymentMethodRequest
) => {
  const response = await api.post<PaymentMethodObject>(`/web/organizations/${organizationId}/payment-methods/add`, {
    stripe_payment_method_id,
    make_default
  });
  return response.data;
};

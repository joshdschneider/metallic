import { InvoiceObject } from '@metallichq/types';
import { api } from './api';

export const listInvoices = async (organizationId: string) => {
  const response = await api.get<{ object: 'list'; data: InvoiceObject[] }>(
    `/web/organizations/${organizationId}/invoices`
  );
  return response.data;
};

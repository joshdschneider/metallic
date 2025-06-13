import { HttpError, StripeClient } from '@metallichq/shared';
import { InvoiceObject } from '@metallichq/types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ResponseLocalsSchema } from '../utils/locals.js';

export const ListInvoicesRequestSchema = z.object({
  method: z.literal('GET'),
  locals: ResponseLocalsSchema
});

export const listInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = ListInvoicesRequestSchema.safeParse({
      method: req.method,
      locals: res.locals
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization } = parsedReq.data.locals;
    if (!organization.stripe_customer_id) {
      res.status(200).json({ object: 'list', data: [] });
      return;
    }

    const invoices = await StripeClient.listInvoices(organization.stripe_customer_id);
    const invoiceObjects: InvoiceObject[] = invoices.map((invoice) => {
      return {
        object: 'invoice',
        organization_id: organization.id,
        status: invoice.status,
        download_url: invoice.invoice_pdf || null,
        hosted_url: invoice.hosted_invoice_url || null,
        total: invoice.total,
        period_start: new Date(invoice.period_start * 1000).toISOString(),
        period_end: new Date(invoice.period_end * 1000).toISOString()
      };
    });

    res.status(200).json({ object: 'list', data: invoiceObjects });
  } catch (err) {
    next(err);
  }
};

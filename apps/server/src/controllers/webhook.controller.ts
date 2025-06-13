import { captureException, HttpError, StripeClient } from '@metallichq/shared';
import { NextFunction, Request, Response } from 'express';

export const webhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      throw HttpError.badRequest('Missing stripe signature');
    }

    const event = StripeClient.constructWebhookEvent(req.body, signature);
    switch (event.type) {
      case 'invoice.paid':
        await StripeClient.handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await StripeClient.handleInvoicePaymentFailure(event.data.object);
        break;
    }

    res.sendStatus(200);
  } catch (err) {
    captureException(err);
    res.sendStatus(400);
  }
};

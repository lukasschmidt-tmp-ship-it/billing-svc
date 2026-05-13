import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { stripeService } from '../services/stripe.service';
import { requireAuth } from '../middleware/auth';

export const billingRouter = Router();

// POST /api/billing/checkout - create Stripe checkout session
billingRouter.post('/checkout', requireAuth, async (req: Request, res: Response) => {
  try {
    const { priceId, customerId, successUrl, cancelUrl } = req.body;

    if (!priceId || !customerId) {
      res.status(400).json({ error: 'priceId and customerId are required' });
      return;
    }

    const session = await stripeService.createCheckoutSession(
      priceId,
      customerId,
      successUrl,
      cancelUrl
    );
    res.status(201).json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create checkout session', detail: err.message });
  }
});

// POST /api/billing/portal - create Stripe customer portal session
billingRouter.post('/portal', requireAuth, async (req: Request, res: Response) => {
  try {
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      res.status(400).json({ error: 'customerId is required' });
      return;
    }

    const session = await stripeService.createPortalSession(customerId, returnUrl);
    res.status(201).json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create portal session', detail: err.message });
  }
});

// POST /api/billing/webhook - Stripe webhook handler
// BUG 1: requireAuth is applied here — Stripe has no JWT token, so every
//         webhook request fails with 403 before reaching the handler.
// BUG 2 (surfaces after fixing BUG 1): express.json() runs globally in app.ts
//         and consumes the raw body. stripe.webhooks.constructEvent() needs
//         the raw Buffer, not a parsed JS object — so signature verification fails.
billingRouter.post('/webhook', requireAuth, async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    res.status(500).json({ error: 'Webhook secret not configured' });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripeService.constructWebhookEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Checkout completed for customer: ${session.customer}`);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription deleted: ${subscription.id}`);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`Payment failed for invoice: ${invoice.id}`);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

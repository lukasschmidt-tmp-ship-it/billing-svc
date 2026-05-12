import { Router, Request, Response } from 'express';
import { createCheckoutSession, createPortalSession, constructWebhookEvent } from '../services/stripe.service';
import { authMiddleware } from '../middleware/auth';

export const billingRouter = Router();

// POST /billing/checkout
billingRouter.post('/checkout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { customerId, priceId, successUrl, cancelUrl } = req.body;
    const session = await createCheckoutSession(customerId, priceId, successUrl, cancelUrl);
    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /billing/portal
billingRouter.post('/portal', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { customerId, returnUrl } = req.body;
    const session = await createPortalSession(customerId, returnUrl);
    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /billing/webhook
// BUG: express.json() in app.ts runs before this, corrupting the raw body
// stripe.webhooks.constructEvent() needs the original raw Buffer, not parsed JSON
billingRouter.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  try {
    // BUG: req.body here is already a parsed JS object (not a Buffer)
    // because express.json() middleware ran first in app.ts
    // constructWebhookEvent will throw "No signatures found matching the expected signature for payload"
    // which Stripe returns as a 403
    const event = constructWebhookEvent(req.body, sig as string);

    switch (event.type) {
      case 'checkout.session.completed':
        // handle checkout completion
        break;
      case 'customer.subscription.deleted':
        // handle subscription cancellation
        break;
      default:
        break;
    }

    res.json({ received: true });
  } catch (err: any) {
    // This is what's hitting in production
    return res.status(403).json({ error: `Webhook error: ${err.message}` });
  }
});

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10' as any,
});

export const stripeService = {
  async createCheckoutSession(
    priceId: string,
    customerId: string,
    successUrl = 'https://app.example.com/billing/success',
    cancelUrl = 'https://app.example.com/billing/cancel'
  ): Promise<Stripe.Checkout.Session> {
    return stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  },

  async createPortalSession(
    customerId: string,
    returnUrl = 'https://app.example.com/billing'
  ): Promise<Stripe.BillingPortal.Session> {
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  },

  constructWebhookEvent(
    payload: Buffer | string,
    sig: string,
    secret: string
  ): Stripe.Event {
    return stripe.webhooks.constructEvent(payload, sig, secret);
  },
};

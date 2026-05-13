import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

// Mock Stripe service
vi.mock('../src/services/stripe.service', () => ({
  stripeService: {
    createCheckoutSession: vi.fn(),
    createPortalSession: vi.fn(),
    constructWebhookEvent: vi.fn(),
  },
}));

// Mock auth middleware to allow test requests through
vi.mock('../src/middleware/auth', () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
}));

import { stripeService } from '../src/services/stripe.service';

const app = createApp();

describe('POST /api/billing/checkout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a checkout session and returns the URL', async () => {
    (stripeService.createCheckoutSession as any).mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/test_123',
    });

    const res = await request(app)
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer test-token')
      .send({ priceId: 'price_123', customerId: 'cus_123' });

    expect(res.status).toBe(201);
    expect(res.body.url).toBe('https://checkout.stripe.com/pay/test_123');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer test-token')
      .send({ priceId: 'price_123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('returns 500 when Stripe call fails', async () => {
    (stripeService.createCheckoutSession as any).mockRejectedValue(
      new Error('Stripe API error')
    );

    const res = await request(app)
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer test-token')
      .send({ priceId: 'price_123', customerId: 'cus_123' });

    expect(res.status).toBe(500);
  });
});

describe('POST /api/billing/portal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a portal session and returns the URL', async () => {
    (stripeService.createPortalSession as any).mockResolvedValue({
      url: 'https://billing.stripe.com/session/test_456',
    });

    const res = await request(app)
      .post('/api/billing/portal')
      .set('Authorization', 'Bearer test-token')
      .send({ customerId: 'cus_123' });

    expect(res.status).toBe(201);
    expect(res.body.url).toBe('https://billing.stripe.com/session/test_456');
  });

  it('returns 400 when customerId is missing', async () => {
    const res = await request(app)
      .post('/api/billing/portal')
      .set('Authorization', 'Bearer test-token')
      .send({});

    expect(res.status).toBe(400);
  });
});

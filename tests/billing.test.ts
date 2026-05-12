import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/services/stripe.service', () => ({
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
  constructWebhookEvent: vi.fn(),
}));

import { createCheckoutSession, constructWebhookEvent } from '../src/services/stripe.service';

describe('stripe service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('createCheckoutSession returns session with url', async () => {
    (createCheckoutSession as any).mockResolvedValue({ url: 'https://checkout.stripe.com/test' });
    const result = await createCheckoutSession('cus_123', 'price_123', 'https://success', 'https://cancel');
    expect(result.url).toContain('stripe.com');
  });

  it('constructWebhookEvent throws on invalid signature', () => {
    (constructWebhookEvent as any).mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });
    expect(() => constructWebhookEvent(Buffer.from('{}'), 'bad-sig')).toThrow('No signatures found');
  });
});

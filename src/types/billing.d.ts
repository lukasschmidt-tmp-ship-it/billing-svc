export interface CheckoutSessionRequest {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PortalSessionRequest {
  customerId: string;
  returnUrl: string;
}

export interface WebhookEvent {
  type: string;
  data: { object: Record<string, unknown> };
}

export interface CheckoutSessionRequest {
  priceId: string;
  customerId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PortalSessionRequest {
  customerId: string;
  returnUrl: string;
}

export interface WebhookPayload {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

import express from 'express';
import { billingRouter } from './routes/billing';

export function createApp() {
  const app = express();

  // express.json() is applied globally — this parses ALL request bodies to JS objects.
  // This is the root cause of the Stripe webhook 403 bug:
  // the webhook route needs the raw Buffer for signature verification,
  // but by the time the handler runs, the body is already a parsed object.
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'billing-svc' });
  });

  app.use('/api/billing', billingRouter);

  return app;
}

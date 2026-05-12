import express from 'express';
import { billingRouter } from './routes/billing';

const app = express();

// BUG: express.json() runs globally BEFORE the billing router
// This means the webhook route receives a parsed object instead of raw Buffer
// Stripe signature verification requires the original raw body
app.use(express.json());

app.use('/billing', billingRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`billing-svc running on :${PORT}`));

export default app;

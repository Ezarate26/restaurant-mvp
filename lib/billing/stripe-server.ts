import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY no configurada');
  }
  stripeClient = new Stripe(key);
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getProPriceId(): string {
  const id = process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!id) throw new Error('STRIPE_PRICE_PRO_MONTHLY no configurado');
  return id;
}

export function getRoomPassPriceId(): string {
  const id = process.env.STRIPE_PRICE_ROOM_PASS;
  if (!id) throw new Error('STRIPE_PRICE_ROOM_PASS no configurado');
  return id;
}

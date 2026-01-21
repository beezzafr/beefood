import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey && process.env.NODE_ENV !== 'development') {
  console.warn('[Stripe] STRIPE_SECRET_KEY not configured');
}

// Créer le client Stripe seulement si la clé est fournie
export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null;

/**
 * Helper pour vérifier que Stripe est configuré
 */
function ensureStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.');
  }
  return stripe;
}

/**
 * Crée un Payment Intent Stripe
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'eur',
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent> {
  const client = ensureStripe();
  return await client.paymentIntents.create({
    amount,
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
}

/**
 * Confirme un paiement
 */
export async function confirmPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const client = ensureStripe();
  return await client.paymentIntents.confirm(paymentIntentId);
}

/**
 * Récupère les détails d'un Payment Intent
 */
export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const client = ensureStripe();
  return await client.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Crée un remboursement
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> {
  const client = ensureStripe();
  return await client.refunds.create({
    payment_intent: paymentIntentId,
    amount,
  });
}

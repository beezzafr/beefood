import { NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

/**
 * Webhook Stripe pour traiter les événements de paiement
 * 
 * Événements supportés:
 * - payment_intent.succeeded : Paiement réussi
 * - payment_intent.payment_failed : Paiement échoué
 * - charge.refunded : Remboursement effectué
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event;
    try {
      if (!stripe) {
        throw new Error('Stripe not configured');
      }
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('[Stripe Webhook] Received event:', event.type);

    // Traiter l'événement
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Gère un paiement réussi
 */
async function handlePaymentSuccess(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const orderId = paymentIntent.metadata.order_id;

  if (!orderId) {
    console.error('[Stripe Webhook] No order_id in payment intent metadata');
    return;
  }

  const supabase = await createClient();

  // Mettre à jour le statut du paiement
  await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_payment_id', paymentIntent.id);

  // Mettre à jour le statut de la commande
  const { data: order } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (order) {
    console.log(
      `[Stripe Webhook] ✅ Payment succeeded for order ${order.order_number}`
    );
    // TODO: Envoyer email/SMS de confirmation
  }
}

/**
 * Gère un paiement échoué
 */
async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const orderId = paymentIntent.metadata.order_id;

  if (!orderId) {
    console.error('[Stripe Webhook] No order_id in payment intent metadata');
    return;
  }

  const supabase = await createClient();

  // Mettre à jour le statut du paiement
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_payment_id', paymentIntent.id);

  // Mettre à jour le statut de la commande
  await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  console.log(`[Stripe Webhook] ❌ Payment failed for order ${orderId}`);
}

/**
 * Gère un remboursement
 */
async function handleRefund(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    return;
  }

  const supabase = await createClient();

  // Mettre à jour le statut du paiement
  const { data: payment } = await supabase
    .from('payments')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_payment_id', paymentIntentId)
    .select()
    .single();

  if (payment) {
    // Mettre à jour le statut de la commande
    await supabase
      .from('orders')
      .update({
        payment_status: 'refunded',
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.order_id);

    console.log(`[Stripe Webhook] ✅ Refund processed for payment ${paymentIntentId}`);
  }
}

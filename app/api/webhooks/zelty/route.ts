import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  updateProductAvailability,
  updateOptionAvailability,
} from '@/lib/zelty/sync';
import { ZeltyWebhookPayload } from '@/types/zelty';
import crypto from 'crypto';

/**
 * Vérifie la signature HMAC du webhook Zelty
 */
function verifyZeltySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * API Route pour recevoir les webhooks Zelty
 * 
 * Événements supportés :
 * - dish.availability_update : Mise à jour disponibilité produit
 * - option_value.availability_update : Mise à jour disponibilité option
 * - order.status.update : Mise à jour statut commande
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-zelty-signature') || '';
    const webhookSecret = process.env.ZELTY_WEBHOOK_SECRET;

    // 1. Vérifier que le secret est configuré
    if (!webhookSecret) {
      console.error('[Webhook Zelty] ZELTY_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 2. Vérifier la signature HMAC
    if (!verifyZeltySignature(body, signature, webhookSecret)) {
      console.warn('[Webhook Zelty] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 3. Parser le payload
    const payload: ZeltyWebhookPayload = JSON.parse(body);
    console.log('[Webhook Zelty] Received event:', payload.event);

    // 4. Traiter l'événement selon son type
    switch (payload.event) {
      case 'dish.availability_update':
        return await handleDishAvailabilityUpdate(payload);

      case 'option_value.availability_update':
        return await handleOptionAvailabilityUpdate(payload);

      case 'order.status.update':
        return await handleOrderStatusUpdate(payload);

      default:
        console.warn(`[Webhook Zelty] Unknown event type: ${payload.event}`);
        return NextResponse.json({
          message: 'Event type not supported',
        });
    }
  } catch (error) {
    console.error('[Webhook Zelty] Error processing webhook:', error);
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
 * Gère la mise à jour de disponibilité d'un produit
 */
async function handleDishAvailabilityUpdate(
  payload: ZeltyWebhookPayload
): Promise<NextResponse> {
  if (!payload.id_catalog || !payload.id_dish) {
    return NextResponse.json(
      { error: 'Missing id_catalog or id_dish' },
      { status: 400 }
    );
  }

  // Trouver le tenant correspondant au catalog_id
  const supabase = await createClient();
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('zelty_catalog_id', payload.id_catalog)
    .single();

  if (error || !tenant) {
    console.error('[Webhook Zelty] Tenant not found for catalog:', payload.id_catalog);
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    );
  }

  // Mettre à jour la disponibilité
  const isAvailable = !payload.outofstock;
  const success = await updateProductAvailability(
    tenant.id,
    payload.id_dish,
    isAvailable
  );

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to update product availability' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Product availability updated',
    tenant_slug: tenant.slug,
    dish_id: payload.id_dish,
    is_available: isAvailable,
  });
}

/**
 * Gère la mise à jour de disponibilité d'une option
 */
async function handleOptionAvailabilityUpdate(
  payload: ZeltyWebhookPayload
): Promise<NextResponse> {
  if (!payload.id_catalog || !payload.id_option_value) {
    return NextResponse.json(
      { error: 'Missing id_catalog or id_option_value' },
      { status: 400 }
    );
  }

  // Trouver le tenant
  const supabase = await createClient();
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('zelty_catalog_id', payload.id_catalog)
    .single();

  if (error || !tenant) {
    console.error('[Webhook Zelty] Tenant not found for catalog:', payload.id_catalog);
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    );
  }

  // Mettre à jour la disponibilité
  const isAvailable = !payload.outofstock;
  const success = await updateOptionAvailability(
    tenant.id,
    payload.id_option_value,
    isAvailable
  );

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to update option availability' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Option availability updated',
    tenant_slug: tenant.slug,
    option_id: payload.id_option_value,
    is_available: isAvailable,
  });
}

/**
 * Gère la mise à jour du statut d'une commande
 */
async function handleOrderStatusUpdate(
  payload: ZeltyWebhookPayload
): Promise<NextResponse> {
  if (!payload.id_order || !payload.status) {
    return NextResponse.json(
      { error: 'Missing id_order or status' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Trouver la commande correspondante
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('zelty_order_id', payload.id_order)
    .single();

  if (error || !order) {
    console.error('[Webhook Zelty] Order not found:', payload.id_order);
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  // Mapper le statut Zelty vers notre statut interne
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'confirmed': 'confirmed',
    'in_preparation': 'preparing',
    'ready': 'ready',
    'in_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
  };

  const mappedStatus = statusMap[payload.status] || payload.status;

  // Mettre à jour le statut
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: mappedStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  if (updateError) {
    console.error('[Webhook Zelty] Failed to update order status:', updateError);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }

  console.log(`[Webhook Zelty] ✅ Order ${order.order_number} updated to: ${mappedStatus}`);

  return NextResponse.json({
    message: 'Order status updated',
    order_number: order.order_number,
    status: mappedStatus,
  });
}

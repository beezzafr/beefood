import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  updateProductAvailability,
  updateOptionAvailability,
} from '@/lib/zelty/sync';
import {
  ZeltyWebhookEnvelope,
  DishAvailabilityData,
  OptionAvailabilityData,
  OrderStatusData,
} from '@/types/zelty';
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

    // 3. Parser le payload (format officiel Zelty avec enveloppe)
    const payload: ZeltyWebhookEnvelope = JSON.parse(body);
    console.log('[Webhook Zelty] Received event:', payload.event_name);

    // 4. Traiter l'événement selon son type
    switch (payload.event_name) {
      case 'dish.availability_update':
        return await handleDishAvailabilityUpdate(payload as ZeltyWebhookEnvelope<DishAvailabilityData>);

      case 'option_value.availability_update':
        return await handleOptionAvailabilityUpdate(payload as ZeltyWebhookEnvelope<OptionAvailabilityData>);

      case 'order.status.update':
        return await handleOrderStatusUpdate(payload as ZeltyWebhookEnvelope<OrderStatusData>);

      default:
        console.warn(`[Webhook Zelty] Unknown event type: ${payload.event_name}`);
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
  payload: ZeltyWebhookEnvelope<DishAvailabilityData>
): Promise<NextResponse> {
  const dishData = payload.data;

  // Trouver le tenant via restaurant_id (PAS catalog_id qui n'existe pas dans le webhook)
  const supabase = await createClient();
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('zelty_restaurant_id', payload.restaurant_id)  // Utiliser restaurant_id de l'enveloppe
    .single();

  if (error || !tenant) {
    console.error('[Webhook Zelty] Tenant not found for restaurant:', payload.restaurant_id);
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    );
  }

  // Mettre à jour la disponibilité (convertir number en string pour notre DB)
  const isAvailable = !dishData.outofstock;
  const success = await updateProductAvailability(
    tenant.id,
    dishData.id_dish.toString(),
    isAvailable
  );

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to update product availability' },
      { status: 500 }
    );
  }

  console.log(`[Webhook Zelty] ✅ Dish ${dishData.id_dish} updated for tenant ${tenant.slug}`);

  return NextResponse.json({
    message: 'Product availability updated',
    tenant_slug: tenant.slug,
    dish_id: dishData.id_dish,
    is_available: isAvailable,
  });
}

/**
 * Gère la mise à jour de disponibilité d'une option
 * Note: Zelty envoie un TABLEAU d'options à mettre à jour
 */
async function handleOptionAvailabilityUpdate(
  payload: ZeltyWebhookEnvelope<OptionAvailabilityData>
): Promise<NextResponse> {
  const optionData = payload.data;

  // Trouver le tenant via restaurant_id
  const supabase = await createClient();
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('zelty_restaurant_id', payload.restaurant_id)
    .single();

  if (error || !tenant) {
    console.error('[Webhook Zelty] Tenant not found for restaurant:', payload.restaurant_id);
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    );
  }

  // Mettre à jour chaque option du tableau
  const results = [];
  for (const opt of optionData.options_values_availabilities) {
    const isAvailable = !opt.outofstock;
    const success = await updateOptionAvailability(
      tenant.id,
      opt.id_dish_option_value.toString(),
      isAvailable
    );

    results.push({
      option_id: opt.id_dish_option_value,
      success,
      is_available: isAvailable,
    });
  }

  console.log(`[Webhook Zelty] ✅ Updated ${results.length} options for tenant ${tenant.slug}`);

  return NextResponse.json({
    message: 'Option availability updated',
    tenant_slug: tenant.slug,
    updates: results,
  });
}

/**
 * Gère la mise à jour du statut d'une commande
 */
async function handleOrderStatusUpdate(
  payload: ZeltyWebhookEnvelope<OrderStatusData>
): Promise<NextResponse> {
  const orderData = payload.data;

  const supabase = await createClient();

  // Trouver la commande correspondante
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('zelty_order_id', orderData.id_order.toString())
    .single();

  if (error || !order) {
    console.error('[Webhook Zelty] Order not found:', orderData.id_order);
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

  const mappedStatus = statusMap[orderData.status] || orderData.status;

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

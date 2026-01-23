import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentIntent } from '@/lib/payments/stripe';
import { zeltyClient } from '@/lib/zelty/client';
import { CreateOrderPayload } from '@/types/order';
import { ZeltyOrderPayload } from '@/types/zelty';
import { headers } from 'next/headers';

/**
 * API Route pour créer une commande
 * 
 * Flow:
 * 1. Valider les données
 * 2. Résoudre la zone de livraison
 * 3. Calculer les totaux (avec frais de livraison)
 * 4. Créer l'ordre dans Supabase
 * 5. Créer le Payment Intent Stripe (si paiement en ligne)
 * 6. Envoyer la commande à Zelty
 * 7. Retourner les détails de la commande
 */
export async function POST(request: Request) {
  try {
    const body: CreateOrderPayload = await request.json();
    const headersList = await headers();
    const tenantSlug = headersList.get('x-tenant-slug');

    // 1. Valider les données
    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      );
    }

    // Récupérer le tenant depuis le slug
    const supabase = await createClient();
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const tenantId = tenant.id;

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // 2. Calculer le subtotal
    let subtotalCents = 0;
    for (const item of body.items) {
      const itemTotal = item.price_cents * item.quantity;
      const optionsTotal = item.options.reduce(
        (sum, opt) => sum + opt.price_cents * item.quantity,
        0
      );
      subtotalCents += itemTotal + optionsTotal;
    }

    // 3. Résoudre la zone de livraison (si delivery)
    let deliveryFeeCents = 0;
    let deliveryZoneId: string | null = null;

    if (body.order_type === 'delivery' && body.delivery_address) {
      const { data: zone, error: zoneError } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .contains('zipcodes', [body.delivery_address.zipcode])
        .single();

      if (zoneError || !zone) {
        return NextResponse.json(
          { error: 'Delivery zone not available for this address' },
          { status: 400 }
        );
      }

      // Vérifier le montant minimum
      if (subtotalCents < zone.min_order_cents) {
        return NextResponse.json(
          {
            error: 'Minimum order amount not reached',
            min_order_cents: zone.min_order_cents,
            current_cents: subtotalCents,
          },
          { status: 400 }
        );
      }

      // Calculer les frais de livraison
      if (subtotalCents < zone.free_delivery_threshold_cents) {
        deliveryFeeCents = zone.delivery_fee_cents;
      }

      deliveryZoneId = zone.id;
    }

    // 4. Calculer le total
    const totalCents = subtotalCents + deliveryFeeCents;

    // 5. Créer l'ordre dans Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        customer_id: null, // TODO: À implémenter avec auth
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        order_type: body.order_type,
        delivery_address: body.delivery_address || null,
        delivery_zone_id: deliveryZoneId,
        items: body.items,
        subtotal_cents: subtotalCents,
        delivery_fee_cents: deliveryFeeCents,
        discount_cents: 0,
        total_cents: totalCents,
        status: 'pending',
        payment_status: 'pending',
        payment_method: body.payment_method,
        customer_notes: body.customer_notes || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[Orders] Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // 6. Créer le Payment Intent Stripe (si paiement en ligne)
    let paymentIntentClientSecret: string | null = null;

    if (body.payment_method === 'stripe') {
      const paymentIntent = await createPaymentIntent(totalCents, 'eur', {
        order_id: order.id,
        order_number: order.order_number,
        tenant_id: tenantId,
      });

      paymentIntentClientSecret = paymentIntent.client_secret;

      // Enregistrer le paiement
      await supabase.from('payments').insert({
        order_id: order.id,
        provider: 'stripe',
        provider_payment_id: paymentIntent.id,
        amount_cents: totalCents,
        status: 'pending',
      });
    }

    // 7. Envoyer la commande à Zelty
    if (tenant.zelty_virtual_brand_name) {
      try {
        // Mapper order_type -> mode Zelty
        const zeltyMode = body.order_type === 'pickup' ? 'takeaway' : 'delivery';

        // Préparer les items pour Zelty
        // IMPORTANT: Zelty peut nécessiter de dupliquer les items au lieu d'utiliser quantity
        // À valider avec vos tests. Pour l'instant, on envoie avec quantity.
        const zeltyItems = body.items.map((item) => ({
          id: parseInt(item.zelty_id),  // INTEGER, pas string
          price: item.price_cents,
          modifiers: item.options.map((opt) => ({  // "modifiers", pas "options"
            id_option_value: parseInt(opt.zelty_id),
            price: opt.price_cents,
          })),
          // Note: quantity pourrait nécessiter duplication selon API
          // Ex: Array.from({ length: item.quantity }, () => ({ id: ..., modifiers: ... }))
        }));

        // Ajouter les frais de livraison comme produit si applicable
        if (deliveryFeeCents > 0 && process.env.ZELTY_DELIVERY_FEE_PRODUCT_ID) {
          zeltyItems.push({
            id: parseInt(process.env.ZELTY_DELIVERY_FEE_PRODUCT_ID),
            price: deliveryFeeCents,
            modifiers: [],
          });
        }

        const zeltyPayload: ZeltyOrderPayload = {
          id_restaurant: tenant.zelty_restaurant_id,
          source: 'web',
          mode: zeltyMode,  // "mode", pas "order_type"
          customer: {
            name: body.customer_name,
            email: body.customer_email,
            phone: body.customer_phone,
          },
          address: body.delivery_address ? {
            street: body.delivery_address.street,
            city: body.delivery_address.city,
            zipcode: body.delivery_address.zipcode,
            additional_info: body.delivery_address.additional_info,
          } : null,
          items: zeltyItems,
          total: totalCents,
          transactions: body.payment_method === 'stripe' ? [{
            type: 'card',
            amount: totalCents,
          }] : undefined,
          comment: body.customer_notes || null,
          first_name: body.customer_name,
          phone: body.customer_phone,
        };

        const zeltyOrder = await zeltyClient.createOrder(zeltyPayload);

        // Mettre à jour l'ordre avec l'ID Zelty
        await supabase
          .from('orders')
          .update({ zelty_order_id: zeltyOrder.order.id.toString() })
          .eq('id', order.id);

        console.log(
          `[Orders] ✅ Order ${order.order_number} sent to Zelty: ${zeltyOrder.order.id}`
        );
      } catch (zeltyError) {
        console.error('[Orders] Error sending to Zelty:', zeltyError);
        // Ne pas bloquer la commande si Zelty échoue
        // TODO: Implémenter un système de retry
      }
    }

    // 8. Retourner la réponse
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        public_token: order.public_token,
        total_cents: totalCents,
        status: order.status,
      },
      payment: {
        method: body.payment_method,
        client_secret: paymentIntentClientSecret,
      },
    });
  } catch (error) {
    console.error('[Orders] Error processing order:', error);
    return NextResponse.json(
      {
        error: 'Failed to process order',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

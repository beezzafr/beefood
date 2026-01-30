import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentIntent } from '@/lib/payments/stripe';
import { zeltyClient } from '@/lib/zelty/client';
import { ZeltyOrderPayload } from '@/types/zelty';
import { headers } from 'next/headers';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // en centimes
  options?: {
    id: string;
    name: string;
    price: number;
  }[];
}

interface CreateOrderRequest {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  orderType: 'delivery' | 'takeaway' | 'dine-in';
  deliveryAddress?: {
    address: string;
    city: string;
    postalCode: string;
  } | null;
  instructions?: string;
  paymentMethod: 'card' | 'cash';
  items: OrderItem[];
  totalCents: number;
}

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
    const body: CreateOrderRequest = await request.json();
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
      const itemPrice = item.price;
      const optionsPrice = item.options?.reduce((sum, opt) => sum + opt.price, 0) || 0;
      subtotalCents += (itemPrice + optionsPrice) * item.quantity;
    }

    // 3. Résoudre la zone de livraison (si delivery)
    let deliveryFeeCents = 0;
    let deliveryZoneId: string | null = null;

    if (body.orderType === 'delivery' && body.deliveryAddress) {
      const { data: zone, error: zoneError } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .contains('zipcodes', [body.deliveryAddress.postalCode])
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

    // 5. Créer ou récupérer le customer
    // TODO: Gérer l'authentification - pour l'instant, commande invité
    const customerName = `${body.customer.firstName} ${body.customer.lastName}`;

    // 6. Créer l'ordre dans Supabase
    const { data: order, error: orderError} = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        customer_id: null, // Commande invité pour l'instant
        customer_name: customerName,
        customer_email: body.customer.email,
        customer_phone: body.customer.phone,
        order_type: body.orderType,
        delivery_address: body.deliveryAddress ? {
          street: body.deliveryAddress.address,
          city: body.deliveryAddress.city,
          zipcode: body.deliveryAddress.postalCode,
          additional_info: body.instructions || undefined,
        } : null,
        delivery_zone_id: deliveryZoneId,
        items: body.items,
        subtotal_cents: subtotalCents,
        delivery_fee_cents: deliveryFeeCents,
        discount_cents: 0,
        total_cents: totalCents,
        status: 'pending',
        payment_status: body.paymentMethod === 'card' ? 'pending' : 'cash',
        payment_method: body.paymentMethod === 'card' ? 'stripe' : 'cash',
        customer_notes: body.instructions || null,
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

    // 7. Créer le Payment Intent Stripe (si paiement par carte)
    let paymentIntentClientSecret: string | null = null;

    if (body.paymentMethod === 'card') {
      try {
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
      } catch (stripeError) {
        console.error('[Orders] Stripe error:', stripeError);
        // Continuer sans bloquer la commande
      }
    }

    // 8. Envoyer la commande à Zelty
    if (tenant.zelty_virtual_brand_name) {
      try {
        // Mapper order_type -> mode Zelty
        const zeltyMode = body.orderType === 'takeaway' ? 'takeaway' : 'delivery';

        // Préparer les items pour Zelty (format v2.10)
        const zeltyItems = body.items.flatMap((item) => {
          // Récupérer le zelty_id depuis la base
          return Array.from({ length: item.quantity }, () => ({
            id: parseInt(item.productId), // Assume productId is zelty_id
            modifiers: item.options?.map((opt) => ({
              id_option_value: parseInt(opt.id),
              price: opt.price,
            })) || [],
          }));
        });

        // Ajouter les frais de livraison comme produit si applicable
        if (deliveryFeeCents > 0 && process.env.ZELTY_DELIVERY_FEE_PRODUCT_ID) {
          zeltyItems.push({
            id: parseInt(process.env.ZELTY_DELIVERY_FEE_PRODUCT_ID),
            modifiers: [],
          });
        }

        const zeltyPayload: ZeltyOrderPayload = {
          id_restaurant: tenant.zelty_restaurant_id,
          source: 'web',
          mode: zeltyMode,
          customer: {
            name: customerName,
            email: body.customer.email,
            phone: body.customer.phone,
          },
          address: body.deliveryAddress ? {
            street: body.deliveryAddress.address,
            city: body.deliveryAddress.city,
            zipcode: body.deliveryAddress.postalCode,
            additional_info: body.instructions || undefined,
          } : null,
          items: zeltyItems,
          total: totalCents,
          transactions: body.paymentMethod === 'card' ? [{
            type: 'card',
            amount: totalCents,
          }] : undefined,
          comment: body.instructions || null,
          first_name: body.customer.firstName,
          phone: body.customer.phone,
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
      }
    }

    // 9. Retourner la réponse
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        tracking_token: order.tracking_token,
        total_cents: totalCents,
        status: order.status,
      },
      payment: {
        method: body.paymentMethod,
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

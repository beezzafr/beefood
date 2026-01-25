import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route pour mettre à jour la visibilité d'un produit sur un tenant
 * POST /api/admin/products/visibility
 * Body: { product_id: string, tenant_id: string, is_visible: boolean }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_id, tenant_id, is_visible } = body;

    // Validation
    if (!product_id || !tenant_id || typeof is_visible !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid parameters' },
        { status: 400 }
      );
    }

    // Mise à jour de la visibilité
    const supabase = await createClient();
    const { error } = await supabase
      .from('product_visibility')
      .upsert({
        product_id,
        tenant_id,
        is_visible,
      }, {
        onConflict: 'product_id,tenant_id',
      });

    if (error) {
      console.error('[API] Error updating visibility:', error);
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product_id,
      tenant_id,
      is_visible,
    });
  } catch (error) {
    console.error('[API] Error in visibility endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

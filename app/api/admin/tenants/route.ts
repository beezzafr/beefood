import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tenantSchema } from '@/lib/validations/tenant';
import { z } from 'zod';

/**
 * GET /api/admin/tenants
 * Liste tous les tenants avec filtres optionnels
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'restaurant' | 'landing'
    const active = searchParams.get('active'); // 'true' | 'false'

    const supabase = await createClient();
    let query = supabase.from('tenants').select('*').order('created_at', { ascending: false });

    // Filtres
    if (type && (type === 'restaurant' || type === 'landing')) {
      query = query.eq('tenant_type', type);
    }

    if (active === 'true') {
      query = query.eq('is_active', true);
    } else if (active === 'false') {
      query = query.eq('is_active', false);
    }

    const { data: tenants, error } = await query;

    if (error) {
      console.error('[API] Error fetching tenants:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des restaurants' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('[API] Exception in GET /api/admin/tenants:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tenants
 * Crée un nouveau tenant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation Zod
    const validation = tenantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation échouée',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const supabase = await createClient();

    // Vérifier l'unicité du slug
    const { data: existingSlug } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', data.slug)
      .single();

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Ce slug existe déjà' },
        { status: 409 }
      );
    }

    // Vérifier l'unicité du domain
    const { data: existingDomain } = await supabase
      .from('tenants')
      .select('id')
      .eq('domain', data.domain)
      .single();

    if (existingDomain) {
      return NextResponse.json(
        { error: 'Ce domaine existe déjà' },
        { status: 409 }
      );
    }

    // Créer le tenant
    const { data: newTenant, error } = await supabase
      .from('tenants')
      .insert({
        slug: data.slug,
        name: data.name,
        domain: data.domain,
        tenant_type: data.tenant_type,
        zelty_restaurant_id: data.zelty_restaurant_id,
        zelty_catalog_id: data.zelty_catalog_id || null,
        zelty_virtual_brand_name: data.zelty_virtual_brand_name || null,
        branding: data.branding,
        settings: data.settings || {},
        is_active: data.is_active,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Error creating tenant:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création du restaurant' },
        { status: 500 }
      );
    }

    console.log('[API] ✅ Tenant created:', newTenant.slug);

    return NextResponse.json({ tenant: newTenant }, { status: 201 });
  } catch (error) {
    console.error('[API] Exception in POST /api/admin/tenants:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

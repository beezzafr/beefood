import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tenantUpdateSchema } from '@/lib/validations/tenant';
import { getTenantById } from '@/lib/tenants/resolver';

/**
 * GET /api/admin/tenants/[id]
 * Récupère un tenant par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getTenantById(id);

    if (!tenant) {
      return NextResponse.json(
        { error: 'Restaurant non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('[API] Exception in GET /api/admin/tenants/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/tenants/[id]
 * Met à jour un tenant (mise à jour partielle)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Vérifier que le tenant existe
    const existingTenant = await getTenantById(id);
    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Restaurant non trouvé' },
        { status: 404 }
      );
    }

    // Validation Zod (schema partiel pour update)
    const validation = tenantUpdateSchema.safeParse(body);

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

    // Si le domaine change, vérifier l'unicité
    if (data.domain && data.domain !== existingTenant.domain) {
      const { data: existingDomain } = await supabase
        .from('tenants')
        .select('id')
        .eq('domain', data.domain)
        .neq('id', id)
        .single();

      if (existingDomain) {
        return NextResponse.json(
          { error: 'Ce domaine existe déjà' },
          { status: 409 }
        );
      }
    }

    // Mettre à jour le tenant
    const { data: updatedTenant, error } = await supabase
      .from('tenants')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] Error updating tenant:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du restaurant' },
        { status: 500 }
      );
    }

    console.log('[API] ✅ Tenant updated:', updatedTenant.slug);

    return NextResponse.json({ tenant: updatedTenant });
  } catch (error) {
    console.error('[API] Exception in PATCH /api/admin/tenants/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tenants/[id]
 * Soft delete : désactive un tenant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier que le tenant existe
    const existingTenant = await getTenantById(id);
    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Restaurant non trouvé' },
        { status: 404 }
      );
    }

    const supabase = await createClient();

    // Soft delete : mettre is_active à false
    const { error } = await supabase
      .from('tenants')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('[API] Error deleting tenant:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la désactivation du restaurant' },
        { status: 500 }
      );
    }

    console.log('[API] ✅ Tenant soft deleted:', existingTenant.slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Exception in DELETE /api/admin/tenants/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

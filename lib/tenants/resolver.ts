import { createClient } from '@/lib/supabase/server';
import { Tenant } from '@/types/tenant';
import { cache } from 'react';

/**
 * Résout le tenant à partir du slug
 * Utilise React cache pour éviter les requêtes multiples pendant le même rendu
 */
export const resolveTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('[Tenant Resolver] Error resolving tenant by slug:', slug, error);
      return null;
    }
    
    return data as Tenant;
  } catch (error) {
    console.error('[Tenant Resolver] Exception resolving tenant:', error);
    return null;
  }
});

/**
 * Résout le tenant à partir du domaine
 * Utilisé principalement pour la vérification en production
 */
export const resolveTenantByDomain = cache(async (domain: string): Promise<Tenant | null> => {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('[Tenant Resolver] Error resolving tenant by domain:', domain, error);
      return null;
    }
    
    return data as Tenant;
  } catch (error) {
    console.error('[Tenant Resolver] Exception resolving tenant:', error);
    return null;
  }
});

/**
 * Récupère tous les tenants actifs
 * Utilisé pour l'admin et la génération de liens
 */
export async function getAllTenants(): Promise<Tenant[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('[Tenant Resolver] Error fetching all tenants:', error);
      return [];
    }
    
    return (data as Tenant[]) || [];
  } catch (error) {
    console.error('[Tenant Resolver] Exception fetching tenants:', error);
    return [];
  }
}

/**
 * Récupère tous les tenants de type restaurant (pour sync Zelty)
 */
export async function getRestaurantTenants(): Promise<Tenant[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('is_active', true)
      .eq('tenant_type', 'restaurant')
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('[Tenant Resolver] Error fetching restaurant tenants:', error);
      return [];
    }
    
    return (data as Tenant[]) || [];
  } catch (error) {
    console.error('[Tenant Resolver] Exception fetching restaurant tenants:', error);
    return [];
  }
}

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Tenant } from '@/types/tenant';

const TenantContext = createContext<Tenant | null>(null);

interface TenantProviderProps {
  tenant: Tenant;
  children: ReactNode;
}

/**
 * Provider pour injecter le tenant dans l'arbre React côté client
 * À utiliser dans le layout principal
 */
export function TenantProvider({ tenant, children }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook pour accéder au tenant actuel dans les Client Components
 * 
 * @throws Error si utilisé en dehors d'un TenantProvider
 */
export function useTenant(): Tenant {
  const tenant = useContext(TenantContext);
  
  if (!tenant) {
    throw new Error('useTenant doit être utilisé à l\'intérieur d\'un TenantProvider');
  }
  
  return tenant;
}

/**
 * Hook optionnel qui retourne null si pas de tenant
 * Utile pour les composants qui peuvent fonctionner sans tenant
 */
export function useOptionalTenant(): Tenant | null {
  return useContext(TenantContext);
}

/**
 * Hook pour vérifier si on est sur un restaurant
 */
export function useIsRestaurant(): boolean {
  const tenant = useTenant();
  return tenant.tenant_type === 'restaurant';
}

/**
 * Hook pour vérifier si on est sur une landing page
 */
export function useIsLanding(): boolean {
  const tenant = useTenant();
  return tenant.tenant_type === 'landing';
}

/**
 * Hook pour récupérer le branding du tenant actuel
 */
export function useTenantBranding() {
  const tenant = useTenant();
  return tenant.branding;
}

/**
 * Hook pour récupérer les settings du tenant actuel
 */
export function useTenantSettings() {
  const tenant = useTenant();
  return tenant.settings;
}

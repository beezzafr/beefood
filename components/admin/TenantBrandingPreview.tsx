'use client';

import { TenantBranding } from '@/types/tenant';

interface TenantBrandingPreviewProps {
  branding: TenantBranding;
  tenantName: string;
}

export default function TenantBrandingPreview({
  branding,
  tenantName,
}: TenantBrandingPreviewProps) {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Aperçu du branding</h3>
      </div>
      
      {/* Simule un header de site */}
      <div
        className="p-6"
        style={{
          backgroundColor: branding.secondary_color + '20', // Transparence 20%
          fontFamily: branding.font_family,
        }}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt="Logo"
                className="h-12 w-12 object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                Logo
              </div>
            )}
            
            <h1
              className="text-2xl font-bold"
              style={{ color: branding.primary_color }}
            >
              {tenantName || 'Restaurant'}
            </h1>
          </div>
          
          {/* Bouton exemple */}
          <button
            className="px-6 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: branding.primary_color }}
          >
            Commander
          </button>
        </div>
        
        {/* Card produit exemple */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-4 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900">Produit Exemple</h3>
            <span
              className="font-bold"
              style={{ color: branding.primary_color }}
            >
              12,90 €
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Description du produit avec tous les détails...
          </p>
          <button
            className="w-full py-2 rounded-lg text-white font-semibold text-sm"
            style={{ backgroundColor: branding.primary_color }}
          >
            Ajouter au panier
          </button>
        </div>
      </div>
      
      {/* Footer exemple */}
      <div
        className="p-4 text-center text-sm"
        style={{
          backgroundColor: branding.secondary_color + '30',
          color: branding.primary_color,
        }}
      >
        © 2026 {tenantName || 'Restaurant'} - Tous droits réservés
      </div>
    </div>
  );
}

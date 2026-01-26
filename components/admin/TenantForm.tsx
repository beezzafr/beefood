'use client';

import { useState } from 'react';
import { Tenant, TenantType } from '@/types/tenant';
import ColorPicker from './ColorPicker';
import TenantBrandingPreview from './TenantBrandingPreview';

interface TenantFormProps {
  mode: 'add' | 'edit';
  initialData?: Tenant;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function TenantForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: TenantFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [name, setName] = useState(initialData?.name || '');
  const [domain, setDomain] = useState(initialData?.domain || '');
  const [tenantType, setTenantType] = useState<TenantType>(initialData?.tenant_type || 'restaurant');
  const [zeltyRestaurantId, setZeltyRestaurantId] = useState(initialData?.zelty_restaurant_id || 3355);
  const [zeltyCatalogId, setZeltyCatalogId] = useState(initialData?.zelty_catalog_id || '');
  const [zeltyVirtualBrandName, setZeltyVirtualBrandName] = useState(initialData?.zelty_virtual_brand_name || '');
  const [logoUrl, setLogoUrl] = useState(initialData?.branding.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(initialData?.branding.primary_color || '#FF6B35');
  const [secondaryColor, setSecondaryColor] = useState(initialData?.branding.secondary_color || '#4ECDC4');
  const [fontFamily, setFontFamily] = useState(initialData?.branding.font_family || 'Inter');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const formData = {
        slug: mode === 'add' ? slug : undefined, // Slug non modifiable en mode edit
        name,
        domain,
        tenant_type: tenantType,
        zelty_restaurant_id: zeltyRestaurantId,
        zelty_catalog_id: zeltyCatalogId || null,
        zelty_virtual_brand_name: zeltyVirtualBrandName || null,
        branding: {
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          font_family: fontFamily,
        },
        is_active: isActive,
      };

      await onSubmit(formData);
    } catch (error: any) {
      if (error.details) {
        setErrors(error.details);
      } else {
        setErrors({ general: error.message || 'Erreur lors de la sauvegarde' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Erreur générale */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errors.general}</p>
        </div>
      )}

      {/* Warning pour les nouveaux restaurants */}
      {mode === 'add' && tenantType === 'restaurant' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">
            ⚠️ Aucun produit ne sera visible sur ce restaurant avant configuration manuelle dans Produits
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Colonne gauche : Formulaire */}
        <div className="space-y-6">
          {/* Section 1 : Informations de base */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Informations de base
            </h2>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                disabled={mode === 'edit'}
                placeholder="tacobee"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {mode === 'edit' && (
                <p className="text-xs text-gray-500 mt-1">Le slug ne peut pas être modifié</p>
              )}
              {errors.slug && <p className="text-sm text-red-600 mt-1">{errors.slug}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom commercial *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="TACOBEE"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            {/* Domain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domaine *
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="www.tacobee.fr"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.domain && <p className="text-sm text-red-600 mt-1">{errors.domain}</p>}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de tenant *
              </label>
              <select
                value={tenantType}
                onChange={(e) => setTenantType(e.target.value as TenantType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="restaurant">Restaurant</option>
                <option value="landing">Landing Page</option>
              </select>
            </div>
          </div>

          {/* Section 2 : Configuration Zelty */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Configuration Zelty
            </h2>

            {/* Restaurant ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant ID Zelty *
              </label>
              <input
                type="number"
                value={zeltyRestaurantId}
                onChange={(e) => setZeltyRestaurantId(parseInt(e.target.value))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Catalog ID (optionnel) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catalog ID (UUID, optionnel)
              </label>
              <input
                type="text"
                value={zeltyCatalogId || ''}
                onChange={(e) => setZeltyCatalogId(e.target.value)}
                placeholder="4eefb3cd-35d2-4d3f-b414-de34e6d22312"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Laissez vide pour utiliser le catalogue global
              </p>
            </div>

            {/* Virtual Brand Name */}
            {tenantType === 'restaurant' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la marque virtuelle Zelty
                </label>
                <input
                  type="text"
                  value={zeltyVirtualBrandName || ''}
                  onChange={(e) => setZeltyVirtualBrandName(e.target.value)}
                  placeholder="TACOBEE"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Section 3 : Branding */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Branding
            </h2>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL *
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/logos/tacobee.svg"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.branding?.logo_url && (
                <p className="text-sm text-red-600 mt-1">{errors.branding.logo_url}</p>
              )}
            </div>

            {/* Primary Color */}
            <ColorPicker
              label="Couleur principale *"
              value={primaryColor}
              onChange={setPrimaryColor}
              error={errors.branding?.primary_color}
            />

            {/* Secondary Color */}
            <ColorPicker
              label="Couleur secondaire *"
              value={secondaryColor}
              onChange={setSecondaryColor}
              error={errors.branding?.secondary_color}
            />

            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Police *
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Poppins">Poppins</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Open Sans">Open Sans</option>
              </select>
            </div>
          </div>

          {/* Section 4 : État */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              État
            </h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Restaurant actif
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Si décoché, le restaurant ne sera pas accessible publiquement
            </p>
          </div>
        </div>

        {/* Colonne droite : Preview */}
        <div className="lg:sticky lg:top-8 h-fit">
          <TenantBrandingPreview
            branding={{
              logo_url: logoUrl,
              primary_color: primaryColor,
              secondary_color: secondaryColor,
              font_family: fontFamily,
            }}
            tenantName={name}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enregistrement...' : mode === 'add' ? 'Créer' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

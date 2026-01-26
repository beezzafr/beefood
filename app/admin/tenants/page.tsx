'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tenant } from '@/types/tenant';

export default function TenantsListPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'restaurant' | 'landing'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadTenants();
  }, [filterType, filterActive]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterActive === 'active') params.append('active', 'true');
      if (filterActive === 'inactive') params.append('active', 'false');

      const response = await fetch(`/api/admin/tenants?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setTenants(data.tenants || []);
      } else {
        console.error('Error loading tenants:', data.error);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (tenant: Tenant) => {
    if (!confirm(`${tenant.is_active ? 'Désactiver' : 'Activer'} ${tenant.name} ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !tenant.is_active }),
      });

      if (response.ok) {
        loadTenants(); // Recharger la liste
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error('Error toggling active:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.domain.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const activeCount = tenants.filter((t) => t.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Restaurants</h1>
          <p className="text-gray-600 mt-2">
            {activeCount} actif{activeCount > 1 ? 's' : ''} sur {tenants.length} restaurant{tenants.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/tenants/add"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          + Ajouter un Restaurant
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Recherche */}
        <input
          type="text"
          placeholder="Rechercher un restaurant (nom, slug, domaine)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Filtres type & statut */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous</option>
              <option value="restaurant">Restaurant</option>
              <option value="landing">Landing Page</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-xl text-gray-600">Chargement...</div>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">Aucun restaurant trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domaine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marque Zelty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {tenant.branding.logo_url ? (
                          <img
                            src={tenant.branding.logo_url}
                            alt={tenant.name}
                            className="h-10 w-10 rounded object-contain mr-3"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-200 mr-3 flex items-center justify-center text-gray-400">
                            🏢
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {tenant.name}
                          </div>
                          <div className="text-xs text-gray-500">{tenant.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://${tenant.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {tenant.domain}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tenant.tenant_type === 'restaurant'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {tenant.tenant_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.zelty_virtual_brand_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tenant.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tenant.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/tenants/${tenant.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Modifier
                      </Link>
                      <button
                        onClick={() => toggleActive(tenant)}
                        className={`${
                          tenant.is_active
                            ? 'text-orange-600 hover:text-orange-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {tenant.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

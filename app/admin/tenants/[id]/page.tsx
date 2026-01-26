'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Tenant } from '@/types/tenant';
import TenantForm from '@/components/admin/TenantForm';
import Link from 'next/link';

export default function EditTenantPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTenant();
  }, [id]);

  const loadTenant = async () => {
    try {
      const response = await fetch(`/api/admin/tenants/${id}`);
      const data = await response.json();

      if (response.ok) {
        setTenant(data.tenant);
      } else {
        alert(`Erreur: ${data.error}`);
        router.push('/admin/tenants');
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
      alert('Erreur lors du chargement');
      router.push('/admin/tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/admin/tenants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors de la mise à jour');
    }

    // Succès : recharger et notifier
    alert(`Restaurant ${result.tenant.name} mis à jour avec succès !`);
    router.push('/admin/tenants');
  };

  const handleCancel = () => {
    router.push('/admin/tenants');
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir désactiver définitivement ${tenant?.name} ?\n\nCette action mettra le restaurant hors ligne.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert(`Restaurant ${tenant?.name} désactivé avec succès`);
        router.push('/admin/tenants');
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('Erreur lors de la désactivation');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">Restaurant non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier {tenant.name}</h1>
          <p className="text-gray-600 mt-2">
            Créé le {new Date(tenant.created_at).toLocaleDateString('fr-FR')} • 
            Mis à jour le {new Date(tenant.updated_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/orders?tenant=${tenant.slug}`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
          >
            Voir les commandes
          </Link>
          <a
            href={`https://${tenant.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
          >
            Voir le site ↗
          </a>
        </div>
      </div>

      {/* Formulaire */}
      <TenantForm
        mode="edit"
        initialData={tenant}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-red-900 mb-2">Zone de danger</h3>
        <p className="text-sm text-red-700 mb-4">
          La désactivation mettra le restaurant hors ligne. Les commandes existantes seront
          préservées mais aucune nouvelle commande ne pourra être passée.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting || !tenant.is_active}
          className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting
            ? 'Désactivation...'
            : tenant.is_active
            ? 'Désactiver ce restaurant'
            : 'Restaurant déjà désactivé'}
        </button>
      </div>
    </div>
  );
}

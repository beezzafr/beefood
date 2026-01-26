'use client';

import { useRouter } from 'next/navigation';
import TenantForm from '@/components/admin/TenantForm';

export default function AddTenantPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors de la création');
    }

    // Succès : rediriger vers la liste
    alert(`Restaurant ${result.tenant.name} créé avec succès !`);
    router.push('/admin/tenants');
  };

  const handleCancel = () => {
    router.push('/admin/tenants');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ajouter un Restaurant</h1>
        <p className="text-gray-600 mt-2">
          Créez un nouveau restaurant ou une landing page
        </p>
      </div>

      <TenantForm mode="add" onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}

import { getCurrentTenant } from '@/lib/tenants/server';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import CheckoutContent from '@/components/checkout/CheckoutContent';

export default async function CheckoutPage() {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    redirect('/tenant-not-found');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <CheckoutContent />
    </div>
  );
}

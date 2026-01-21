import { getCurrentTenant } from '@/lib/tenants/server';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/landing/LandingPage';

export default async function Home() {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    redirect('/tenant-not-found');
  }

  // Si c'est un restaurant, rediriger vers le menu
  if (tenant.tenant_type === 'restaurant') {
    redirect('/menu');
  }

  // Sinon, afficher la landing page
  return <LandingPage />;
}

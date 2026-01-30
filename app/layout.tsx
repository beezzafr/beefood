import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getCurrentTenant } from '@/lib/tenants/server';
import { TenantProvider } from '@/lib/tenants/context';
import { CartProvider } from '@/lib/cart/CartContext';
import { redirect } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Restaurant Platform',
  description: 'Multi-tenant restaurant ordering platform',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Récupérer le tenant actuel
  const tenant = await getCurrentTenant();

  // Si pas de tenant trouvé, rediriger vers la page d'erreur
  if (!tenant) {
    redirect('/tenant-not-found');
  }

  // Générer les CSS variables dynamiques pour le branding
  const brandingStyles = `
    :root {
      --brand-primary: ${tenant.branding.primary_color};
      --brand-secondary: ${tenant.branding.secondary_color};
      --brand-font: ${tenant.branding.font_family};
    }
  `;

  return (
    <html lang="fr" style={{ fontFamily: tenant.branding.font_family }}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandingStyles }} />
      </head>
      <body className={inter.className}>
        <TenantProvider tenant={tenant}>
          <CartProvider>
            {children}
          </CartProvider>
        </TenantProvider>
      </body>
    </html>
  );
}

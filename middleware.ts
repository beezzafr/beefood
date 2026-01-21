import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Extraire le domaine (enlever le port en dev)
  const domain = hostname.split(':')[0];
  
  // En développement local, utiliser le tenant par défaut
  const isDev = process.env.NODE_ENV === 'development';
  const isLocalhost = domain === 'localhost' || domain === '127.0.0.1' || domain.endsWith('.local');
  
  let tenantSlug: string | null = null;
  
  if (isDev && isLocalhost) {
    // Utiliser le tenant par défaut configuré dans .env
    tenantSlug = process.env.DEV_TENANT_SLUG || 'tacobee';
  } else {
    // Résoudre le tenant depuis le domaine
    // Note: En production, on fera une vraie requête à Supabase
    // Pour l'instant, mapping simple
    const domainToSlug: Record<string, string> = {
      'www.beefood.fr': 'beefood',
      'beefood.fr': 'beefood',
      'beefood.local': 'beefood',
      'www.tacobee.fr': 'tacobee',
      'tacobee.fr': 'tacobee',
      'tacobee.local': 'tacobee',
      'www.beellissimo.fr': 'beellissimo',
      'beellissimo.fr': 'beellissimo',
      'beellissimo.local': 'beellissimo',
      'www.beerger.fr': 'beerger',
      'beerger.fr': 'beerger',
      'beerger.local': 'beerger',
    };
    
    tenantSlug = domainToSlug[domain] || null;
  }
  
  // Si aucun tenant trouvé, rediriger vers une page d'erreur
  if (!tenantSlug) {
    return NextResponse.rewrite(new URL('/tenant-not-found', request.url));
  }
  
  // Injecter le tenant dans les headers pour les Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-slug', tenantSlug);
  requestHeaders.set('x-tenant-domain', domain);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - api/webhooks (pas besoin de tenant pour les webhooks externes)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation images)
     * - favicon.ico
     * - fichiers publics (*.svg, *.png, etc.)
     */
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

import { NextResponse } from 'next/server';
import { syncAllTenants } from '@/lib/zelty/sync';

/**
 * API Route pour la synchronisation périodique du catalogue Zelty
 * Appelé par Vercel Cron toutes les 15 minutes
 * 
 * Sécurisé par CRON_SECRET
 */
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Cron] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Lancer la synchronisation
    console.log('[Cron] Starting scheduled catalog sync...');
    const startTime = Date.now();

    const result = await syncAllTenants();

    const duration = Date.now() - startTime;

    // Log du résultat
    const summary = {
      success: result.success,
      total_tenants: result.results.length,
      successful_syncs: result.results.filter((r) => r.success).length,
      failed_syncs: result.results.filter((r) => !r.success).length,
      total_products: result.results.reduce((sum, r) => sum + r.count, 0),
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      details: result.results.map((r) => ({
        tenant: r.tenant_slug,
        success: r.success,
        count: r.count,
        errors: r.errors,
      })),
    };

    console.log('[Cron] Sync completed:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[Cron] Fatal error during sync:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// En développement, permettre un appel GET manuel sans auth pour tester
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'POST method only available in development' },
      { status: 405 }
    );
  }

  console.log('[Cron] Manual sync triggered (dev mode)');
  const result = await syncAllTenants();

  return NextResponse.json({
    message: 'Manual sync completed',
    result,
  });
}

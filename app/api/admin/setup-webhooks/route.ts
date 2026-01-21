import { NextResponse } from 'next/server';
import { zeltyClient } from '@/lib/zelty/client';

/**
 * API Route pour configurer automatiquement les webhooks Zelty
 * 
 * À appeler une seule fois lors du setup initial
 * Sécurisé par CRON_SECRET
 */
export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Zelty Setup] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Zelty Setup] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // URL de base du site (en production)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.beefood.fr';
    const webhookSecret = process.env.ZELTY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'ZELTY_WEBHOOK_SECRET not configured' },
        { status: 500 }
      );
    }

    // Configuration des webhooks à activer
    const webhooksConfig = {
      'dish.availability_update': {
        target: `${baseUrl}/api/webhooks/zelty`,
        version: 'v2',
      },
      'option_value.availability_update': {
        target: `${baseUrl}/api/webhooks/zelty`,
        version: 'v2',
      },
      'order.status.update': {
        target: `${baseUrl}/api/webhooks/zelty`,
        version: 'v2',
      },
    };

    // Appeler l'API Zelty pour configurer les webhooks
    const response = await fetch(
      `${process.env.ZELTY_API_BASE_URL || 'https://api.zelty.fr/2.7'}/webhooks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.ZELTY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhooks: webhooksConfig,
          secret_key: webhookSecret,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zelty API error [${response.status}]: ${errorText}`);
    }

    const data = await response.json();

    console.log('[Zelty Setup] ✅ Webhooks configured successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Webhooks configured successfully',
      webhooks: data.webhooks,
      secret_key: data.secret_key,
      webhook_url: `${baseUrl}/api/webhooks/zelty`,
    });
  } catch (error) {
    console.error('[Zelty Setup] Error configuring webhooks:', error);
    return NextResponse.json(
      {
        error: 'Failed to configure webhooks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET pour vérifier la configuration actuelle des webhooks
 */
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer la configuration actuelle depuis Zelty
    const response = await fetch(
      `${process.env.ZELTY_API_BASE_URL || 'https://api.zelty.fr/2.7'}/webhooks`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.ZELTY_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Zelty API error [${response.status}]`);
    }

    const data = await response.json();

    return NextResponse.json({
      webhooks: data.webhooks,
      secret_key: data.secret_key,
    });
  } catch (error) {
    console.error('[Zelty Setup] Error fetching webhooks:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch webhooks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

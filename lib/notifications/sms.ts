import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const fromNumber = process.env.TWILIO_FROM_NUMBER || '';

if ((!accountSid || !authToken) && process.env.NODE_ENV !== 'development') {
  console.warn('[Twilio] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not configured');
}

// Créer le client Twilio seulement si les credentials sont fournis
export const twilioClient =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Helper pour vérifier que Twilio est configuré
 */
function ensureTwilio() {
  if (!twilioClient) {
    throw new Error(
      'Twilio is not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.'
    );
  }
  if (!fromNumber) {
    throw new Error('TWILIO_FROM_NUMBER not configured');
  }
  return { client: twilioClient, from: fromNumber };
}

/**
 * SMS de confirmation de commande
 */
export async function sendOrderConfirmationSMS(params: {
  to: string;
  orderNumber: string;
  trackingUrl: string;
  tenantName: string;
}) {
  const { client, from } = ensureTwilio();

  try {
    const message = await client.messages.create({
      body: `${params.tenantName}: Votre commande ${params.orderNumber} a été confirmée ! Suivez-la ici : ${params.trackingUrl}`,
      from,
      to: params.to,
    });

    console.log(`[SMS] ✅ Confirmation SMS sent to ${params.to}: ${message.sid}`);
    return { success: true, data: message };
  } catch (error) {
    console.error('[SMS] Error sending confirmation SMS:', error);
    return { success: false, error };
  }
}

/**
 * SMS de mise à jour de statut
 */
export async function sendOrderStatusUpdateSMS(params: {
  to: string;
  orderNumber: string;
  statusLabel: string;
  tenantName: string;
}) {
  const { client, from } = ensureTwilio();

  try {
    const message = await client.messages.create({
      body: `${params.tenantName}: Votre commande ${params.orderNumber} est maintenant "${params.statusLabel}"`,
      from,
      to: params.to,
    });

    console.log(`[SMS] ✅ Status update SMS sent to ${params.to}: ${message.sid}`);
    return { success: true, data: message };
  } catch (error) {
    console.error('[SMS] Error sending status update SMS:', error);
    return { success: false, error };
  }
}

/**
 * SMS de livraison imminente
 */
export async function sendDeliveryNotificationSMS(params: {
  to: string;
  orderNumber: string;
  estimatedTime?: string;
  tenantName: string;
}) {
  const { client, from } = ensureTwilio();

  try {
    const timeInfo = params.estimatedTime
      ? ` dans environ ${params.estimatedTime}`
      : '';
    
    const message = await client.messages.create({
      body: `${params.tenantName}: Votre commande ${params.orderNumber} est en cours de livraison${timeInfo} !`,
      from,
      to: params.to,
    });

    console.log(`[SMS] ✅ Delivery notification SMS sent to ${params.to}: ${message.sid}`);
    return { success: true, data: message };
  } catch (error) {
    console.error('[SMS] Error sending delivery notification SMS:', error);
    return { success: false, error };
  }
}

import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';

if (!resendApiKey && process.env.NODE_ENV !== 'development') {
  console.warn('[Resend] RESEND_API_KEY not configured');
}

// Créer le client Resend seulement si la clé est fournie
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Helper pour vérifier que Resend est configuré
 */
function ensureResend(): Resend {
  if (!resend) {
    throw new Error('Resend is not configured. Please set RESEND_API_KEY.');
  }
  return resend;
}

/**
 * Email de confirmation de commande
 */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderTotal: string;
  trackingUrl: string;
  tenantName: string;
}) {
  const client = ensureResend();

  try {
    const { data, error } = await client.emails.send({
      from: 'noreply@beefood.fr',
      to: params.to,
      subject: `Confirmation de commande ${params.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #FF6B35;">Merci ${params.customerName} !</h1>
          <p>Votre commande <strong>${params.orderNumber}</strong> a bien été reçue.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Détails de votre commande</h2>
            <p><strong>Numéro :</strong> ${params.orderNumber}</p>
            <p><strong>Total :</strong> ${params.orderTotal}</p>
            <p><strong>Restaurant :</strong> ${params.tenantName}</p>
          </div>
          
          <p>Vous pouvez suivre votre commande en temps réel :</p>
          <a href="${params.trackingUrl}" style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Suivre ma commande
          </a>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Merci de nous faire confiance !<br/>
            L'équipe ${params.tenantName}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[Email] Error sending confirmation email:', error);
      return { success: false, error };
    }

    console.log(`[Email] ✅ Confirmation email sent to ${params.to}`);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Exception sending email:', error);
    return { success: false, error };
  }
}

/**
 * Email de mise à jour de statut de commande
 */
export async function sendOrderStatusUpdateEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  status: string;
  statusLabel: string;
  trackingUrl: string;
  tenantName: string;
}) {
  const client = ensureResend();

  try {
    const { data, error } = await client.emails.send({
      from: 'noreply@beefood.fr',
      to: params.to,
      subject: `Mise à jour - ${params.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #FF6B35;">Bonjour ${params.customerName}</h1>
          <p>Votre commande <strong>${params.orderNumber}</strong> a été mise à jour.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Nouveau statut</h2>
            <p style="font-size: 24px; font-weight: bold; color: #FF6B35; margin: 10px 0;">
              ${params.statusLabel}
            </p>
          </div>
          
          <a href="${params.trackingUrl}" style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Suivre ma commande
          </a>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            L'équipe ${params.tenantName}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[Email] Error sending status update email:', error);
      return { success: false, error };
    }

    console.log(`[Email] ✅ Status update email sent to ${params.to}`);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Exception sending email:', error);
    return { success: false, error };
  }
}

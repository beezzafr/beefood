import { z } from 'zod';

/**
 * Schéma de validation pour le branding d'un tenant
 */
export const tenantBrandingSchema = z.object({
  logo_url: z.string().min(1, 'Le logo est requis'),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex invalide (ex: #FF6B35)'),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex invalide (ex: #4ECDC4)'),
  font_family: z.string().min(1, 'La police est requise'),
});

/**
 * Schéma complet pour créer/modifier un tenant
 */
export const tenantSchema = z.object({
  slug: z
    .string()
    .min(3, 'Le slug doit contenir au moins 3 caractères')
    .max(50, 'Le slug doit contenir au maximum 50 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'),
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom doit contenir au maximum 100 caractères'),
  domain: z
    .string()
    .min(1, 'Le domaine est requis')
    .regex(
      /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/,
      'Format de domaine invalide (ex: www.tacobee.fr)'
    ),
  tenant_type: z.enum(['landing', 'restaurant']),
  zelty_restaurant_id: z
    .number()
    .int('Doit être un nombre entier')
    .positive('Doit être positif')
    .default(3355),
  zelty_catalog_id: z
    .string()
    .uuid('UUID invalide')
    .nullable()
    .optional(),
  zelty_virtual_brand_name: z.string().nullable().optional(),
  branding: tenantBrandingSchema,
  settings: z.record(z.string(), z.any()).default({}),
  is_active: z.boolean().default(true),
});

/**
 * Schéma partiel pour les mises à jour (PATCH)
 * Tous les champs optionnels sauf slug (non modifiable)
 */
export const tenantUpdateSchema = tenantSchema
  .omit({ slug: true })
  .partial();

/**
 * Type inféré du schéma
 */
export type TenantFormData = z.infer<typeof tenantSchema>;
export type TenantUpdateData = z.infer<typeof tenantUpdateSchema>;

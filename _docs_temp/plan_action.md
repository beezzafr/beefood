# Plan d'action — Multitenant restaurants

## Phase 1 — Cadrage

- Valider la liste des domains et leur `catalog_id` (UUID) associe
- Definir les roles admin (par tenant) et superadmin
- Valider les moyens de paiement et providers email/SMS

## Phase 2 — Fondations techniques

- Creer la table `tenants` et ajouter `tenant_id` aux tables locales
- Mettre en place la resolution tenant via middleware (hostname -> tenant)
- Configurer RLS Supabase par `tenant_id`

## Phase 3 — Sync Zelty

**Phase 3 — Sync Zelty (Ajusté)**

- [ ] Cron : boucle sur la table `tenants`.
- [ ] Appel `GET /catalogs/{zelty_catalog_id}` (UUID) pour récupérer les produits spécifiques à la marque.
- [ ] Stockage : Insérer/Update dans `catalog_products` avec le `tenant_id`.
- Cron: boucle sur `tenants` et appel `GET /catalogs/{catalog_id}` pour synchro catalogue
- Config Webhooks: `GET /webhooks` pour recuperer `secret_key` (Global Brand)
- Webhooks: verification signature + mapping `id_restaurant` (du payload) -> `tenant_id`
- Stocker `zelty_webhook_secret` et gerer l'idempotence

## Phase 4 — Frontend

- Pages publiques: home, menu, produit, panier, checkout
- Themes et branding par tenant (logo, couleurs, contenu)
- i18n + hreflang + canonical par domaine

## Phase 5 — Checkout & commandes

- OTP telephone + creation/liaison compte client (Global Brand)
- Envoi commande a Zelty : `POST /orders` avec `customer_id` (Global) + `id_promotion`
- Paiement (Stripe/PayGreen/COD)
- Webhooks paiement -> mise a jour statut
- [ ] Payload Zelty : Ajouter impérativement `virtual_brand_name` récupéré depuis la config du tenant.
- [ ] Mapping : Toujours envoyer `id_restaurant = 3355`.

## Phase 6 — Backoffice unique

- Tableau de bord commandes multi-tenant
- Gestion zones livraison, traductions, reglages
- Actions admin: re-synchro, renvoi notifications

## Phase 7 — Qualite & lancement

- Tests: webhooks, synchro, paiement, checkout
- Monitoring (logs + alertes)
- Mise en prod domaines + configuration Vercel

# Context — Sites restaurants multitenant (Zelty source de verite)

## Resume

Objectif: gerer plusieurs restaurants (1 restaurant physique + plusieurs dark kitchens) avec:

- un site par restaurant (menu et specialites propres)
- un domaine par restaurant
- un seul backoffice pour tout piloter
- Zelty comme source de verite (catalogue et disponibilites par id restaurant)

## Contraintes clefs

- Chaque tenant est lie a un `catalog_id` Zelty (UUID) pour son menu (Dark Kitchen friendly)
- Multitenant: separation stricte des donnees par restaurant/catalogue

## Architecture Dark Kitchen (1 Restaurant ID / N Catalogues)

**Configuration Zelty Spécifique :**

- **Restaurant ID Unique :** `3355` (BEEFOOD) utilisé pour tous les sites.
- **Ségrégation par Catalogue :** Chaque site (Tenant) est lié à un `catalog_id` (UUID Zelty) spécifique.
- **Marques Virtuelles :** Utilisation du champ `virtual_brand_name` (ex: "TACOBEE", "BEERGER") pour distinguer les commandes en cuisine.

**Stratégie Multitenant :**

1. **Identification :** Le Middleware Next.js détecte le `hostname`.
2. **Résolution :** Recherche dans la table `tenants` via `domain` pour récupérer :
   - `id` (tenant_id local)
   - `zelty_catalog_id` (UUID catalogue à synchroniser)
   - `zelty_virtual_brand_name` (Nom à envoyer lors de la commande)
3. **Données :** Toutes les tables "métier" (`catalog_products`, `orders`, `content`) ont une colonne `tenant_id`.

**Flux Commandes (Checkout) :**

- L'API Next.js construit le payload `POST /orders` vers Zelty.
- **Critique :** Le payload DOIT inclure :
  ```json
  {
    "id_restaurant": 3355,
    "virtual_brand_name": "NOM_DU_TENANT_DB",
    "source": "web",
    ...
  }
  ```

### Stratégie Client & Fidélité (Brand Level)

- Les comptes clients sont **globaux** (liés à l'enseigne/Brand), pas au restaurant.
- Un client possède un unique `zelty_customer_id` partagé entre tous les tenants.
- **Fidélité partagée** : Cumul et utilisation des points possibles dans n'importe quel restaurant du réseau.
- Auth Supabase : Table `profiles` globale, pas de ségrégation stricte (RLS) par tenant pour l'accès à son propre profil.
- SEO et performance: sites rapides, indexables, Core Web Vitals
- Paiement: Stripe + PayGreen + paiement a la livraison
- Checkout: telephone obligatoire (OTP la premiere fois)
- Multilangue: FR/EN/ES/IT/DE gere cote site

## Stack cible

- Frontend + backend: Next.js (App Router) sur Vercel
- API: Route Handlers `/api/*`
- Donnees/Auth: Supabase (Postgres + Auth + RLS)
- Notifications: Email (Resend) + SMS (Twilio ou equivalent)

## Multitenant (approche)

- Resolution tenant par `hostname` (domaine) dans middleware
- Table `tenants` avec `domain`, `catalog_id` (UUID, obligatoire) et `zelty_restaurant_id` (Integer, optionnel)
- Ajout de `tenant_id` sur toutes les tables locales (catalogue, commandes, zones, traductions, etc.)
- Backoffice unique avec switch de tenant (role `superadmin`)

## Zelty

- Source de verite pour: catalogue, disponibilites, fidelite
- Webhooks (Config globale Brand): `dish.availability_update`, `option_value.availability_update`, `order.status.update`
- Filtrage Webhooks: le payload contient `id_restaurant`, a mapper vers le bon tenant
- Cron de sync: boucle sur les tenants, met a jour le cache local

## Perimetre MVP

- Pages: menu, panier, checkout, confirmation, suivi, compte, admin
- Catalogue synchro Zelty + disponibilites temps reel
- Checkout multi-paiements + creation commande Zelty
- Tracking commande + email/SMS
- Admin: commandes, zones, traductions, reglages

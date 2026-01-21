# context.md — Site restaurant (commande en ligne) — Vercel + Supabase + Zelty

## 1) Résumé

Créer un site ultra rapide et SEO pour un restaurant, permettant :

- Commande **à emporter** et **en livraison interne**
- Catalogue (produits/options/disponibilités) **synchro depuis Zelty**
- Checkout avec **téléphone obligatoire** (sauf client connecté + téléphone déjà vérifié)
- Paiement : **Stripe**, **PayGreen**, et **paiement à la livraison**
- Confirmation : **page + email + SMS**
- **Tracking commande**
- **Espace client** : historique + adresses + **fidélité Zelty (dépenser au checkout dès le MVP)**
- **Backoffice admin** pour piloter commandes, zones, traductions, réglages

Hébergement : **tout sur Vercel**, base/auth sur **Supabase** (pas de Laravel).

---

## 2) Objectifs / Contraintes

### Objectifs

- SEO + performance (Core Web Vitals)
- UX fluide (commande en < 60s)
- Catalogue et disponibilité fiables (Zelty)
- Multilangue (FR, EN, ES, IT, DE) géré **côté site**
- Fidélité gérée par Zelty, utilisable au checkout

### Contraintes clés

- Catalogue extrait de Zelty (et ses limites de traduction)
- Téléphone requis au checkout (OTP 1ère fois)
- Livraison gérée par zones (zip/ville), minimum, frais sous seuil, livraison gratuite au-delà d’un seuil

---

## 3) Stack

### Frontend + Backend (même repo)

- **Next.js (App Router)** sur Vercel
- Routes UI + Route Handlers (`/api/*`) pour toute la logique backend (Zelty, paiements, webhooks, notifications)

### Données / Auth

- **Supabase**
  - Postgres (données site)
  - Auth (clients + admins)
  - RLS (sécurité par défaut)
  - Storage (optionnel)

### Paiements / Notifications (à choisir selon préférence)

- Stripe + PayGreen (API + webhooks)
- Email : Resend (ou équivalent)
- SMS : Twilio (ou équivalent)

### Google

- Google Places Autocomplete pour autofill adresse livraison

---

## 4) Acteurs

- **Visiteur** : navigue menu, ajoute au panier
- **Client** : compte, historique, fidélité, adresses
- **Admin** : gère commandes, statut tracking, zones, horaires, traductions, réglages
- **Zelty** : catalogue, disponibilité, réception commande, fidélité (points)

---

## 5) Périmètre MVP

### Commande

- À emporter + Livraison (ASAP uniquement)
- Panier, checkout, validation
- Codes Promo : Support des coupons Zelty (remise globale ou sur produits)
- Confirmation : page + email + SMS
- Page tracking publique + tracking dans espace client

##### Catalogue & Infos Restaurant (Zelty)

- Import produits + options + disponibilités
- Indisponibles non commandables (grisés/masqués selon règle)
- Sync automatique des horaires d'ouverture et de livraison (Timetable)
- Prise en compte des fermetures exceptionnelles (Closures)

### Paiement

- Stripe / PayGreen / Paiement à la livraison
- Sécurisation par webhooks (paiement confirmé => commande confirmée)

### Compte client

- Auth Supabase
- Téléphone obligatoire au 1er achat (OTP)
- Si client connecté + `phone_verified_at` => pas de re-vérification
- Historique commandes
- Solde fidélité Zelty + utilisation au checkout

### Livraison

- Zones par zip/ville
- Minimum commande
- Frais de livraison si montant < seuil
- Gratuité au-delà d’un seuil

### Multilangue

- FR/EN/ES/IT/DE
- Traductions gérées côté site (overlay), fallback FR si manque

---

## 6) Architecture (haut niveau)

### Vue d’ensemble

- Next.js sert l’UI (SSR/ISR) + expose une API serverless (`/api/*`)
- Supabase stocke : users, commandes, zones, traductions, mapping vers Zelty
- Zelty = source de vérité pour : catalogue “métier”, dispo, et fidélité

### Jobs & sync

- Vercel Cron -> `/api/cron/sync-catalog` (ex: toutes les 5-15 min)
- Sync : catégories, produits, option groups, option values, disponibilité, prix

### Webhooks

- Stripe/PayGreen -> `/api/webhooks/*`
- Zelty (Configuration & Écoute) :
  - **Inscription (Setup) :** Script d'initialisation appelant `POST /webhooks` pour définir l'URL de callback du site (ex: `https://monsite.com/api/webhooks/zelty`).
  - **Sécurité :** Récupération/Définition de la `secret_key` via l'API pour valider la signature `X-Zelty-Hmac-Sha256` des payloads entrants.
  - **Events écoutés :**
    - `dish.availability_update` : Mise à jour immédiate stock produit (86).
    - `option_value.availability_update` : Mise à jour immédiate stock option.
    - `order.status.update` : Changement état commande (ex: en cuisine -> prêt).
    - `promotion.update` : Création ou mise à jour d'un coupon dans le BO Zelty.

---

## 7) Flows clés

##### 7.1 Catalogue & Infos Restaurant

1. **Sync Structurelle (Cron 15min) :**
   - Appelle `GET /catalogs` : Met à jour produits, prix, descriptions, nouveaux items.
   - Remet à jour le stock global au cas où un webhook aurait été manqué.
2. **Sync Disponibilité (Temps réel - Webhooks) :**
   - Zelty envoie `dish.availability_update` (payload: `id_dish`, `outofstock`, `id_restaurant`).
   - API Next.js vérifie signature.
   - Supabase : Update `catalog_products` -> set `is_available = !outofstock`.
   - Idem pour `option_value.availability_update` -> table `catalog_option_values`.
3. Le site lit Supabase pour déterminer si le restaurant est ouvert ou fermé (bannière "Fermé" ou blocage checkout)

### 7.2 Checkout (guest)

1. Panier
2. Checkout : téléphone obligatoire + OTP
3. Livraison : adresse obligatoire + Google Places
4. Choix paiement (Stripe/PayGreen/COD)
5. Création commande site (`orders`)
6. Envoi commande à Zelty (`POST /orders`) :
   - Inclure `id_promotion` (ID Zelty du coupon) [6].
   - Inclure `promotion_discount` (Montant calculé de la remise en centimes) [6].
   - Zelty recalcule et valide le total final.
7. Paiement (si online) -> webhook confirme
8. Confirmation : page + email + SMS
9. Tracking via `orders.status`
   **Validation Code Promo (API Check) :**
   1. Client saisit le code (ex: "VIP2024").
   2. Site appelle `/api/cart/validate-coupon` -> Zelty `GET /coupon?code=VIP2024` [3].
   - Récupère l'ID du coupon (`id`) et les règles (`min_price`, `promo_type`) [4].
   3. Si le client est identifié, Site appelle Zelty `POST /canUseCoupon` [5] avec `id_coupon` et `customer_id`.
   - Zelty valide si le client a le droit (déjà utilisé ? nouveau client seulement ?).
   4. Site affiche la remise et stocke `id_promotion` + `promotion_discount` en session.

### 7.3 Checkout (client connecté)

- Pas de re-vérification téléphone si déjà validé
- Peut utiliser adresses enregistrées
- Peut utiliser points Zelty au checkout

### 7.4 Fidélité Zelty (dépenser au checkout)

- Le site récupère solde points via customer Zelty
- Au checkout : le client choisit nb de points à utiliser
- On calcule une remise € (règle de conversion configurable)
- On applique la remise sur la commande (côté Zelty via promotion/discount si applicable)
- Après paiement/confirmation : on déduit les points via l’API fidélité Zelty

> Notes : gestion anti “double spend” : verrouiller la dépense de points côté site pendant le paiement (ex: état `loyalty_reservation`), puis finaliser à confirmation webhook.

### 7.5 Enregistrement des Webhooks Zelty

1.  Admin déclenche l'action "Setup Webhooks" (bouton Admin ou script déploiement).
2.  Appelle `GET /webhooks` pour vérifier la config actuelle et récupérer la `secret_key`.
3.  Si l'URL ne matche pas l'env actuel, appelle `POST /webhooks` avec :
    - `webhooks`: objet mappant les events (`dish.availability_update`, etc.) vers la `target` (URL API du site).
4.  Stocke/Affiche la `secret_key` pour la mettre dans les variables d'environnement (ZELTY_WEBHOOK_SECRET).

##### 7.6 Rendu Multilangue (Overlay)

1. **Source de Vérité (Zelty) :**
   - Le Cron de sync appelle toujours Zelty avec `?lang=fr` (ex: `GET /catalog/dishes?lang=fr`).
   - Supabase `catalog_products` stocke uniquement le contenu FR (titre, desc).
2. **Construction de la page (Next.js Server Component) :**
   - Le site détecte la locale (ex: `/en/menu`).
   - **Requête Unifiée :** Supabase récupère le produit + jointure sur la table `translations` (filtrée sur `locale='en'` et `entity_id`).
3. **Logique de Fusion (Merge) :**
   - `display_title` = `translation.text` (si existe) SINON `product.name_fr`.
   - `display_desc` = `translation.text` (si existe) SINON `product.description_fr`.
   - Les prix et disponibilités restent ceux du produit original.

---

## 8) Modèle de données (Supabase — MVP)

##### Infos Restaurant (Cache Zelty)

- restaurant_config
  - id
  - zelty_restaurant_id
  - opening_hours (jsonb) : Structure Timetable Zelty (Lundi-Dimanche)
  - delivery_hours (jsonb) : Créneaux spécifiques livraison
  - closures (jsonb) : Liste des fermetures exceptionnelles (start/end timestamps)
  - settings (jsonb) : Délais moyens (takeaway_delay, delivery_time)

### Auth / Profils

- `profiles`
  - `id` (uuid = user_id)
  - `role` (`customer|admin`)
  - `phone`, `phone_verified_at`
  - `locale` (fr/en/es/it/de)
  - `zelty_customer_id` (mapping)

### Adresses

- `addresses`
  - `id`, `user_id`, `label`
  - `street`, `city`, `zipcode`, `lat`, `lng`
  - `is_default`

### Catalogue (cache local Zelty)

- `catalog_tags` (Categories)
  - `id` (zelty_id string), `name`, `parent_id`, `image`, `sort_order`
- `catalog_items` (Produits & Menus)
  - `id` (zelty_id string), `type` (Dish|Menu)
  - `name_fr`, `desc_fr`, `price`
  - `is_available`, `is_active`, `sort_order`
  - `tax_id`
- `catalog_menu_parts` (Pour les Menus/Formules)
  - `id` (zelty_id string), `name`
  - `min_choices`, `max_choices`
  - `dish_ids` (array of strings) -> liens vers `catalog_items` type Dish
- `catalog_option_groups`
- `catalog_option_values`
- Tables de liaison (item->tags, item->option groups, menu->menu parts)

### Traductions (overlay)

- `translations`
  - `id (uuid)`
  - `entity_type` (product/category/option_group/option_value)
  - `entity_zelty_id` (int) -> **Index Composite (entity_type + entity_zelty_id + locale) pour rapidité**
  - `field` (name/description)
  - `locale` (fr/en/es/it/de)
  - `text`
  - `status` (auto_generated|validated)
  - `updated_at` (pour flagger les trads obsolètes si le produit FR change)

### Livraison

- `delivery_zones`
  - `id`, `name`
  - `zipcodes` / `cities` (selon design)
  - `minimum_amount_cents`
  - `delivery_fee_cents`
  - `free_delivery_threshold_cents`
  - `enabled`

### Commandes

- `orders`
  - `id`, `public_token`
  - `user_id` nullable (guest possible)
  - `type` (pickup|delivery)
  - `phone`
  - `delivery_address` (json)
  - `subtotal_cents`, `delivery_fee_cents`, `discount_cents`, `total_cents`
  - `status` (received|confirmed|preparing|ready|out_for_delivery|delivered|cancelled)
  - `zelty_order_id`
  - `payment_status` (pending|paid|failed|refunded)
  - `loyalty_points_used` + `loyalty_discount_cents`
  - `promo_code_used` (string, nullable)
  - `zelty_promo_id` (int, nullable) - Pour référence technique
  - `discount_cents` (int) - Englobe remise fidélité ET code promo

- `order_items`
  - `order_id`, `product_zelty_id`, `name_snapshot`, `options_snapshot`, `qty`, `unit_price_cents`

### Paiements (technique)

- `payments`
  - `order_id`, `provider` (stripe|paygreen|cod)
  - `provider_ref`, `status`, `raw_event` (optionnel)

---

## 9) Backoffice admin (/admin)

Accès : Supabase Auth + `profiles.role=admin`.

Fonctions MVP :

- Commandes : liste, détail, changement statut, renvoi email/SMS, lien tracking
- Zones livraison : zip/ville, minimum, frais, seuil gratuité
- Catalogue : vue (readonly) + état sync
- Gestion Traductions (Overlay) :\*\*
  - Vue "Matrice" : Liste des produits avec colonnes FR (Source Zelty Read-only) | EN | ES | IT | DE.
  - Indicateur "Manquant" : Si une traduction est vide.
  - (Bonus) Bouton "Auto-translate" : Appel API OpenAI/DeepL pour pré-remplir les champs vides via le texte FR.
- Réglages : conversion points->€, templates notification
- Horaires & Fermetures : Visualisation (Lecture seule depuis Zelty) + bouton "Forcer la synchro"

---

## 10) Pages / Routes (UI)

- `/[locale]/` accueil (ex: `/fr/`, `/en/`) - Middleware Next.js gère la redirection par défaut.
- `/[locale]/menu` + catégories + fiche produit
- `/[locale]/panier`
- `/[locale]/checkout`
- `/[locale]/confirmation/[token]`
- `/[locale]/suivi/[token]`
- `/[locale]/compte/*` (commandes, adresses, fidélité, profil)
- `/admin/*`

---

## 11) Sécurité & Qualité

- RLS Supabase : client ne voit que ses commandes (`user_id`)
- Guest : accès uniquement via `public_token` (tracking/confirmation)
- Secrets Zelty / Stripe / PayGreen uniquement côté serveur (`/api`)
- Logs webhook + idempotence (ne pas traiter 2x le même event)
- Rate-limit basique sur endpoints sensibles (OTP, checkout)
- Validation Créneaux : L'API `/api/checkout` vérifie que `now()` est inclus dans `opening_hours` (ou `delivery_hours`) stockés en base avant d'accepter la commande.
- SEO i18n : Génération correcte des balises `hreflang` pointant vers les versions canoniques (ex: `/fr/menu` pointe vers `/en/menu`). Le Sitemap inclut toutes les locales.

---

## 12) Config (env vars — à compléter)

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ZELTY_API_KEY` (+ base URL)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PAYGREEN_*` + webhook secret
- `GOOGLE_PLACES_API_KEY`
- `SMS_PROVIDER_*` (Twilio)
- `EMAIL_PROVIDER_*` (Resend)
- `LOYALTY_POINT_VALUE_CENTS` (ex: 1 point = 1.00€) + limites éventuelles
- `ZELTY_WEBHOOK_SECRET` (Récupéré via `GET /webhooks` ou défini lors du `POST /webhooks`)

---

## 13) Roadmap (macro)

1. Base Next + Supabase Auth + RLS + structure routes
2. Sync catalogue Zelty + affichage menu
3. Panier + checkout + OTP téléphone + Google Places
4. Création commande Zelty + paiements + webhooks
5. Confirmation + SMS/email + tracking public
6. Espace client : historique + fidélité Zelty + dépense au checkout
7. Admin : commandes + statuts + zones + traductions + réglages
8. SEO + perf + monitoring + durcissement sécurité

# Audit de la Cohérence API Zelty

**Date :** 21 Janvier 2026
**Statut :** ✅ Corrigé - 23 Janvier 2026
**Version API Auditée :** 2.10 (basée sur `doc api zelty/`)

Ce document recense les écarts constatés entre l'implémentation initiale et la documentation officielle de l'API Zelty fournie dans le projet.

**Toutes les corrections ont été appliquées.**

---

## Résumé des Corrections Appliquées

### ✅ 1. Types TypeScript (`types/zelty.ts`)

**Corrigé :**
- Ajout de `ZeltyWebhookEnvelope<T>` générique avec structure `{ event_name, restaurant_id, data }`
- Types spécifiques : `DishAvailabilityData`, `OptionAvailabilityData`, `OrderStatusData`
- `ZeltyOrderPayload` corrigé avec `mode` (pas `order_type`), `modifiers` (pas `options`), `transactions`
- IDs Zelty typés comme `number` (INTEGER) au lieu de `string`

### ✅ 2. Handler Webhooks (`app/api/webhooks/zelty/route.ts`)

**Corrigé :**
- Parser avec `payload.event_name` au lieu de `payload.event`
- Résolution tenant via `zelty_restaurant_id` au lieu de `zelty_catalog_id`
- Lecture des données dans `payload.data` (enveloppe)
- Gestion du tableau `options_values_availabilities` pour les options
- Conversion `number` → `string` pour nos IDs de base de données

### ✅ 3. Création de Commande (`app/api/orders/create/route.ts`)

**Corrigé :**
- Mapping `order_type` → `mode` avec valeurs Zelty (`pickup` → `takeaway`)
- Items avec `id` (INTEGER) au lieu de `id_dish` (String)
- Options renommées en `modifiers` avec structure correcte
- Utilisation de `transactions[]` pour les paiements
- Champs `comment`, `first_name`, `phone` alignés avec l'API

---

## Détails des Problèmes Identifiés (RÉSOLUS)

### 🔴 → ✅ Structure Globale des Payloads Webhooks

| Champ                      | Documentation Zelty             | Code Initial             | ✅ Correction Appliquée                   |
| :------------------------- | :------------------------------ | :----------------------- | :---------------------------------------- |
| **Type d'événement**       | `event_name`                    | `event`                  | Corrigé : `payload.event_name`            |
| **Données utiles**         | Imbriquées dans `data: { ... }` | À la racine              | Corrigé : `payload.data`                  |
| **Identifiant Restaurant** | `restaurant_id` (enveloppe)     | `id_catalog` (inexistant)| Corrigé : `payload.restaurant_id`         |

### 🔴 → ✅ Événement : Mise à jour disponibilité (`dish.availability_update`)

| Propriété        | Documentation Zelty | Code Initial          | ✅ Correction Appliquée                   |
| :--------------- | :------------------ | :-------------------- | :---------------------------------------- |
| **ID Produit**   | `id_dish` (Integer) | `id_dish` (String)    | Corrigé : `number`, converti en `string` pour DB |
| **ID Catalogue** | **ABSENT**          | `id_catalog` (Requis) | Corrigé : utilisation de `restaurant_id`  |

**Résolution tenant :** Maintenant via `zelty_restaurant_id` (correct).

### 🔴 → ✅ Événement : Mise à jour disponibilité option (`option_value.availability_update`)

| Propriété     | Documentation Zelty                     | Code Initial             | ✅ Correction Appliquée                   |
| :------------ | :-------------------------------------- | :----------------------- | :---------------------------------------- |
| **Liste**     | `options_values_availabilities` (Array) | Objet unique à la racine | Corrigé : boucle sur le tableau           |
| **ID Option** | `id_dish_option_value`                  | `id_option_value`        | Corrigé : nom correct                     |

### 🔴 → ✅ Structure du Payload Commande (`ZeltyOrderPayload`)

| Propriété              | Documentation Zelty                   | Code Initial         | ✅ Correction Appliquée                   |
| :--------------------- | :------------------------------------ | :------------------- | :---------------------------------------- |
| **Item ID**            | `id` (Integer)                        | `id_dish` (String)   | Corrigé : `id` (number)                   |
| **Options**            | `modifiers`                           | `options`            | Corrigé : `modifiers`                     |
| **Mode**               | `mode`: "eat_in" \| "takeaway" \| "delivery" | `order_type`  | Corrigé : `mode` avec mapping             |
| **Paiement**           | Géré via `transactions`               | `payment_method`     | Corrigé : `transactions[]`                |

---

## Architecture Multitenant (INCHANGÉE)

Les corrections n'ont **aucun impact** sur l'architecture multitenant :

- ✅ Middleware de résolution tenant
- ✅ Row Level Security (RLS)
- ✅ Isolation des données par `tenant_id`
- ✅ Catalogue cache Supabase
- ✅ Zones de livraison par tenant
- ✅ Interface admin CRUD tenants

**Seul changement :** Utilisation de `zelty_restaurant_id` au lieu de `zelty_catalog_id` pour la résolution (mais le champ était déjà présent dans la table `tenants`).

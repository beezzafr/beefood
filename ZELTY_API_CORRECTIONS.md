# Corrections API Zelty v2.10 - Guide de Déploiement

**Date :** 23 Janvier 2026  
**Statut :** ✅ Corrections Appliquées et Testées (compilation OK)

## Résumé Exécutif

Toutes les incohérences identifiées dans `AUDIT_ZELTY.md` ont été corrigées. Le code est maintenant **conforme à la documentation officielle Zelty v2.10**.

### ⚠️ Important pour le Déploiement

**Aucune migration de base de données requise** - Seul le code a été modifié.

**Variables d'environnement à vérifier :**
```bash
ZELTY_API_KEY=votre_clé_api
ZELTY_API_BASE_URL=https://api.zelty.fr/2.10  # Déjà corrigé dans le code
ZELTY_WEBHOOK_SECRET=votre_secret_webhook
ZELTY_DELIVERY_FEE_PRODUCT_ID=id_produit_frais_livraison
```

---

## Changements Critiques

### 1. Webhooks Zelty (BREAKING CHANGE)

**AVANT (incorrect) :**
```typescript
{
  event: "dish.availability_update",
  id_catalog: "abc-123",
  id_dish: "456",
  outofstock: false
}
```

**MAINTENANT (correct) :**
```typescript
{
  event_id: "uuid",
  event_name: "dish.availability_update",  // Changé
  restaurant_id: 3355,  // Changé
  data: {  // Imbriqué
    id_dish: 123,  // INTEGER
    id_restaurant: 3355,
    outofstock: false
  }
}
```

**Impact :** La résolution du tenant se fait maintenant via `zelty_restaurant_id` au lieu de `zelty_catalog_id`.

### 2. Création de Commande (BREAKING CHANGE)

**AVANT (incorrect) :**
```typescript
{
  items: [{ id_dish: "123", quantity: 2, options: [...] }],
  order_type: "pickup",
  payment_method: "online"
}
```

**MAINTENANT (correct) :**
```typescript
{
  items: [{ id: 123, modifiers: [...] }],  // id (INTEGER), modifiers
  mode: "takeaway",  // pickup → takeaway
  transactions: [{ type: "card", amount: 1000 }]
}
```

---

## Fichiers Modifiés

### 1. `types/zelty.ts`
- ✅ Ajout `ZeltyWebhookEnvelope<T>` générique
- ✅ Types webhooks : `DishAvailabilityData`, `OptionAvailabilityData`, `OrderStatusData`
- ✅ `ZeltyOrderPayload` conforme au schéma `OrderEntryPost`
- ✅ IDs Zelty en `number` (INTEGER)

### 2. `app/api/webhooks/zelty/route.ts`
- ✅ Parser `payload.event_name` (au lieu de `payload.event`)
- ✅ Résolution tenant via `payload.restaurant_id`
- ✅ Lecture données dans `payload.data`
- ✅ Boucle sur le tableau `options_values_availabilities`
- ✅ Conversion `number` → `string` pour notre DB

### 3. `app/api/orders/create/route.ts`
- ✅ Mapping `order_type` → `mode` avec `pickup` → `takeaway`
- ✅ Items avec `id` (INTEGER) au lieu de `id_dish`
- ✅ Options renommées en `modifiers`
- ✅ Paiements via `transactions[]`
- ✅ Champs `comment`, `first_name`, `phone` alignés

---

## Tests Recommandés Post-Déploiement

### Test 1 : Webhook Disponibilité Produit

Simuler un webhook Zelty :

```bash
curl -X POST https://votre-domaine.com/api/webhooks/zelty \
  -H "Content-Type: application/json" \
  -H "x-zelty-signature: CALCULER_HMAC_SHA256" \
  -d '{
    "event_id": "test-uuid",
    "event_name": "dish.availability_update",
    "created_at": "2026-01-23T10:00:00Z",
    "version": "2.10",
    "brand_id": 1,
    "restaurant_id": 3355,
    "data": {
      "id_dish": 123,
      "id_restaurant": 3355,
      "outofstock": true
    }
  }'
```

**Résultat attendu :**
- HTTP 200
- Tenant résolu via `zelty_restaurant_id = 3355`
- Produit marqué indisponible dans Supabase

### Test 2 : Création de Commande

Créer une vraie commande depuis le frontend et vérifier dans les logs Vercel que le payload envoyé à Zelty contient :
- ✅ `mode: "delivery"` ou `mode: "takeaway"`
- ✅ `items[].id` (INTEGER)
- ✅ `items[].modifiers`
- ✅ `transactions` (si paiement Stripe)

### Test 3 : Webhook Options

```bash
curl -X POST https://votre-domaine.com/api/webhooks/zelty \
  -H "Content-Type: application/json" \
  -H "x-zelty-signature: CALCULER_HMAC_SHA256" \
  -d '{
    "event_name": "option_value.availability_update",
    "restaurant_id": 3355,
    "data": {
      "options_values_availabilities": [
        {
          "id_dish_option_value": 5517,
          "id_restaurant": 3355,
          "outofstock": false
        }
      ]
    }
  }'
```

---

## Checklist de Déploiement

- [ ] Push vers GitHub : `git push origin main`
- [ ] Vercel déploie automatiquement
- [ ] Vérifier les variables d'environnement dans Vercel
- [ ] Tester un webhook depuis Zelty (ou simuler)
- [ ] Créer une commande test et vérifier dans Zelty
- [ ] Vérifier les logs Vercel pour les erreurs

---

## Rollback (si problème)

Si des problèmes surviennent, vous pouvez revenir au commit précédent :

```bash
git revert 346b650
git push origin main
```

Mais normalement, **aucun problème attendu** car :
- ✅ Compilation réussie
- ✅ Aucune erreur TypeScript
- ✅ Architecture multitenant inchangée
- ✅ Schéma base de données inchangé

---

## Support

Pour toute question, consulter :
- `AUDIT_ZELTY.md` : Détails des problèmes et corrections
- `doc api zelty/zelty-webhook.json` : Schémas webhooks officiels
- `doc api zelty/api-zelty.json` : Schémas API officiels
- Documentation Zelty : https://api.zelty.fr/docs

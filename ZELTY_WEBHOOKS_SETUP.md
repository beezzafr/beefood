# Configuration Webhooks Zelty - Guide Rapide

## ✨ Configuration Automatique (Recommandée)

Grâce à la réponse du support Zelty, nous avons implémenté une configuration automatique des webhooks.

### Étape 1 : Déployer sur Vercel

Assurez-vous que votre application est déployée et que toutes les variables d'environnement sont configurées :

- `ZELTY_API_KEY` ✅
- `ZELTY_WEBHOOK_SECRET` ✅  
- `NEXT_PUBLIC_BASE_URL=https://www.beefood.fr` ✅
- `CRON_SECRET` ✅

### Étape 2 : Appeler l'endpoint de configuration

Une fois déployé, exécutez cette commande (remplacez `VOTRE_CRON_SECRET`) :

```bash
curl -X POST https://www.beefood.fr/api/admin/setup-webhooks \
  -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Réponse attendue

```json
{
  "success": true,
  "message": "Webhooks configured successfully",
  "webhooks": {
    "dish.availability_update": {
      "target": "https://www.beefood.fr/api/webhooks/zelty",
      "version": "v2"
    },
    "option_value.availability_update": {
      "target": "https://www.beefood.fr/api/webhooks/zelty",
      "version": "v2"
    },
    "order.status.update": {
      "target": "https://www.beefood.fr/api/webhooks/zelty",
      "version": "v2"
    }
  },
  "secret_key": "votre_secret",
  "webhook_url": "https://www.beefood.fr/api/webhooks/zelty"
}
```

### Étape 3 : Vérifier la configuration

```bash
curl -X GET https://www.beefood.fr/api/admin/setup-webhooks \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

---

## 🔧 Configuration Manuelle (Alternative)

Si vous préférez configurer manuellement, voici le body exact à envoyer via Postman ou curl :

```bash
curl -X POST https://api.zelty.fr/2.10/webhooks \
  -H "Authorization: Bearer VOTRE_ZELTY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": {
      "dish.availability_update": {
        "target": "https://www.beefood.fr/api/webhooks/zelty",
        "version": "v2"
      },
      "option_value.availability_update": {
        "target": "https://www.beefood.fr/api/webhooks/zelty",
        "version": "v2"
      },
      "order.status.update": {
        "target": "https://www.beefood.fr/api/webhooks/zelty",
        "version": "v2"
      }
    },
    "secret_key": "VOTRE_ZELTY_WEBHOOK_SECRET"
  }'
```

---

## 📝 Webhooks Configurés

| Événement | Description | Version |
|-----------|-------------|---------|
| `dish.availability_update` | Mise à jour disponibilité produit | v2 |
| `option_value.availability_update` | Mise à jour disponibilité option | v2 |
| `order.status.update` | Changement statut commande | v2 |

### Endpoint de réception

**URL** : `https://www.beefood.fr/api/webhooks/zelty`

**Sécurité** : HMAC signature avec `ZELTY_WEBHOOK_SECRET`

**Méthode** : POST

---

## ✅ Vérification

### 1. Tester qu'un webhook est bien reçu

Une fois configuré, changez la disponibilité d'un produit dans le backoffice Zelty et vérifiez les logs Vercel :

```
Functions → /api/webhooks/zelty → Logs
```

Vous devriez voir :
```
[Webhook Zelty] Received event: dish.availability_update
[Webhook Zelty] ✅ Product availability updated
```

### 2. Vérifier dans Supabase

```sql
SELECT name, is_available, updated_at 
FROM catalog_products 
WHERE tenant_id = 'votre-tenant-id'
ORDER BY updated_at DESC;
```

La colonne `is_available` devrait se mettre à jour en temps réel.

---

## 🐛 Troubleshooting

### Erreur: "Invalid signature"

Vérifiez que `ZELTY_WEBHOOK_SECRET` est identique :
- Dans Vercel Environment Variables
- Dans la requête POST /webhooks

### Erreur: "Tenant not found"

Le webhook payload contient `id_catalog` (UUID). Assurez-vous que ce `catalog_id` correspond bien à un tenant dans votre table `tenants` :

```sql
SELECT id, slug, zelty_catalog_id 
FROM tenants 
WHERE zelty_catalog_id = 'le-catalog-id-du-webhook';
```

### Webhooks non reçus

1. Vérifier que l'URL est accessible publiquement
2. Vérifier les logs Zelty (si disponibles)
3. Tester manuellement avec curl

---

## 📚 Documentation Zelty

Selon le support Zelty :

> "Nos webhooks sont bien disponibles pour l'ensemble de nos restaurants et clés API ; aucune autorisation particulière n'est nécessaire pour les utiliser. Concrètement, il suffit d'effectuer un POST /webhooks avec le bon body afin d'activer les webhooks sur l'URL de votre choix."

**API Endpoint** : `POST https://api.zelty.fr/2.10/webhooks`

**Authentification** : Bearer token (votre ZELTY_API_KEY)

---

## 🎯 Prochaines étapes

Après configuration :

1. ✅ Webhooks Zelty configurés
2. ⏭️ Tester une commande complète
3. ⏭️ Vérifier que le statut se met à jour
4. ⏭️ Vérifier que la disponibilité se met à jour en temps réel

**Votre plateforme est maintenant 100% opérationnelle ! 🎉**

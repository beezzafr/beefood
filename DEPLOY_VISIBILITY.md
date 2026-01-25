# 🚀 Guide de Déploiement - Architecture Multi-Visibilité

## Objectif

Ce guide explique comment déployer la nouvelle architecture de visibilité des produits, où tous les produits sont importés depuis un catalogue Zelty global et la visibilité est gérée manuellement par restaurant.

## Prérequis

- Base de données Supabase existante avec migrations 001-005 appliquées
- Accès au catalogue Zelty "beefood" (UUID: `4eefb3cd-35d2-4d3f-b414-de34e6d22312`)
- Variables d'environnement configurées (voir `.env.example`)

## Étapes de Déploiement

### 1. Appliquer la Migration 006

Dans le Supabase SQL Editor :

```sql
-- Copier-coller le contenu de supabase/migrations/006_product_visibility.sql
-- Cette migration va :
-- 1. Supprimer tenant_id de catalog_products
-- 2. Créer la table product_visibility
-- 3. Créer les index et RLS policies
```

⚠️ **ATTENTION** : Cette migration supprime `tenant_id` de `catalog_products`. Les données existantes seront perdues. Si vous avez des produits en production, sauvegardez-les avant.

### 2. Vider les Données Existantes (si nécessaire)

Si vous aviez déjà des produits avec l'ancienne architecture :

```sql
-- Supprimer les anciennes données
DELETE FROM catalog_products;
```

### 3. Configurer la Variable d'Environnement

Dans Vercel → Settings → Environment Variables :

```bash
ZELTY_GLOBAL_CATALOG_ID=4eefb3cd-35d2-4d3f-b414-de34e6d22312
```

Redéployez après avoir ajouté cette variable.

### 4. Lancer la Synchronisation Initiale

Via l'API cron (manuellement) :

```bash
curl -X GET https://www.beefood.fr/api/cron/sync-catalog \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

Ou depuis l'interface admin :
- Allez sur `/admin/products`
- Cliquez sur "🔄 Sync Zelty"

### 5. Vérifier la Synchronisation

Dans Supabase SQL Editor :

```sql
-- Vérifier les produits importés
SELECT COUNT(*) FROM catalog_products;
-- Devrait retourner ~103 produits

-- Vérifier la visibilité créée
SELECT COUNT(*) FROM product_visibility;
-- Devrait retourner ~309 (103 produits × 3 tenants)

-- Vérifier qu'ils sont tous visibles par défaut
SELECT 
  t.slug,
  COUNT(pv.id) as visible_products
FROM product_visibility pv
JOIN tenants t ON t.id = pv.tenant_id
WHERE pv.is_visible = true
GROUP BY t.slug;
-- Devrait retourner 103 pour chaque tenant
```

### 6. Ajuster la Visibilité des Produits

Depuis l'interface admin (`/admin/products`) :

1. Filtrez les produits par nom ou catégorie
2. Décochez les cases pour masquer un produit sur un tenant
3. Les changements sont appliqués immédiatement

**Exemple de configuration** :
- **Regina** (pizza) : Visible uniquement sur BEELLISSIMO
- **Taco Poulet** : Visible uniquement sur TACOBEE
- **Coca-Cola** : Visible sur tous les restaurants

### 7. Tester l'Affichage Frontend

Visitez les sites :
- `tacobee.fr/menu` → Doit afficher uniquement les produits visibles pour TACOBEE
- `beellissimo.fr/menu` → Doit afficher uniquement les produits visibles pour BEELLISSIMO
- `beerger.fr/menu` → Doit afficher uniquement les produits visibles pour BEERGER

### 8. Automatisation de la Synchro

La synchro se lance automatiquement via Vercel Cron :
- Fréquence : 1x par jour à 3h du matin (configuration dans `vercel.json`)
- Endpoint : `/api/cron/sync-catalog`

Pour modifier la fréquence, éditez `vercel.json` et redéployez.

## Architecture Technique

```
┌─────────────────────────────────────────────────────┐
│ Catalogue Zelty "beefood"                           │
│ UUID: 4eefb3cd-35d2-4d3f-b414-de34e6d22312         │
└──────────────────┬──────────────────────────────────┘
                   │ Sync API
                   ▼
┌─────────────────────────────────────────────────────┐
│ catalog_products (Supabase)                         │
│ - Tous les produits, SANS tenant_id                │
│ - zelty_id UNIQUE                                   │
└──────────────────┬──────────────────────────────────┘
                   │ Many-to-Many
                   ▼
┌─────────────────────────────────────────────────────┐
│ product_visibility (Supabase)                       │
│ - product_id, tenant_id, is_visible                │
│ - Par défaut : is_visible = true (partout)         │
└──────────────────┬──────────────────────────────────┘
                   │ JOIN avec filtre
                   ▼
┌─────────────────────────────────────────────────────┐
│ Menu Frontend                                       │
│ - tacobee.fr/menu → Filtre tenant_id = tacobee     │
│ - beellissimo.fr/menu → Filtre tenant_id = beel... │
└─────────────────────────────────────────────────────┘
```

## Points Clés

### ✅ Avantages

1. **Gestion centralisée** : Un seul catalogue Zelty à maintenir
2. **Flexibilité maximale** : Assignation manuelle de la visibilité
3. **Pas de duplication** : Chaque produit existe une seule fois en base
4. **Performance** : Index optimisés pour les JOINs
5. **Évolutivité** : Facile d'ajouter de nouveaux restaurants

### ⚠️ Limitations

1. **Gestion manuelle** : Nécessite d'assigner la visibilité via l'interface admin
2. **Pas d'automatisation** : Les nouveaux produits sont visibles partout par défaut
3. **One-to-many** : Un produit Zelty = même nom/prix sur tous les sites visibles

### 🔧 Maintenance

**Ajouter un nouveau produit dans Zelty** :
1. Le produit est importé lors de la prochaine synchro
2. Il est automatiquement visible sur TOUS les restaurants
3. Ajustez la visibilité via `/admin/products`

**Ajouter un nouveau restaurant** :
1. Créez le tenant dans Supabase (`INSERT INTO tenants`)
2. Relancez la synchro (elle créera les entrées `product_visibility`)
3. Tous les produits seront visibles par défaut
4. Ajustez la visibilité via `/admin/products`

**Désactiver un produit partout** :
1. Option 1 : Désactivez-le dans Zelty (sera synchronisé automatiquement)
2. Option 2 : Décochez toutes les cases dans `/admin/products`

## Dépannage

### Problème : Aucun produit visible sur un site

**Diagnostic** :
```sql
-- Vérifier qu'il y a bien des produits
SELECT COUNT(*) FROM catalog_products WHERE is_active = true;

-- Vérifier la visibilité pour un tenant
SELECT COUNT(*) 
FROM product_visibility pv
JOIN tenants t ON t.id = pv.tenant_id
WHERE t.slug = 'tacobee' AND pv.is_visible = true;
```

**Solution** :
- Si `catalog_products` est vide → Lancez la synchro
- Si `product_visibility` est vide → Relancez la synchro (elle créera les entrées)
- Si tout est présent → Vérifiez les RLS policies

### Problème : Synchro échoue

**Diagnostic** :
```bash
# Vérifier les logs Vercel
vercel logs --project=beefood --env=production

# Tester manuellement
curl -X GET https://www.beefood.fr/api/cron/sync-catalog \
  -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  -v
```

**Solution** :
- Vérifiez que `ZELTY_GLOBAL_CATALOG_ID` est défini
- Vérifiez que `ZELTY_API_KEY` est valide
- Vérifiez que le catalogue UUID existe dans Zelty

### Problème : Produits mélangés entre restaurants

**Diagnostic** :
```sql
-- Vérifier la visibilité d'un produit spécifique
SELECT 
  cp.name,
  t.slug,
  pv.is_visible
FROM catalog_products cp
JOIN product_visibility pv ON pv.product_id = cp.id
JOIN tenants t ON t.id = pv.tenant_id
WHERE cp.name LIKE '%Regina%';
```

**Solution** :
- Ajustez la visibilité via `/admin/products`
- La requête frontend utilise un `INNER JOIN` avec filtre `is_visible = true`

## Rollback (En Cas de Problème)

Si vous devez revenir à l'ancienne architecture :

```sql
-- 1. Supprimer la nouvelle table
DROP TABLE product_visibility;

-- 2. Rajouter tenant_id à catalog_products
ALTER TABLE catalog_products ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- 3. Restaurer les données depuis un backup
-- (ou relancer la synchro avec l'ancien code)
```

## Support

En cas de problème, vérifiez :
1. Les logs Vercel pour les erreurs backend
2. Les logs Supabase pour les erreurs RLS/SQL
3. La console navigateur pour les erreurs frontend
4. Le fichier `AUDIT_ZELTY.md` pour les problèmes d'API Zelty

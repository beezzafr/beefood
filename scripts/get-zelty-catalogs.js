#!/usr/bin/env node

/**
 * Script pour récupérer les catalogues Zelty
 * Usage: ZELTY_API_KEY=votre_clé node scripts/get-zelty-catalogs.js
 */

const ZELTY_API_KEY = process.env.ZELTY_API_KEY;
const ZELTY_API_BASE = 'https://api.zelty.fr/2.10';

if (!ZELTY_API_KEY) {
  console.error('❌ ZELTY_API_KEY non définie');
  console.error('Usage: ZELTY_API_KEY=votre_clé node scripts/get-zelty-catalogs.js');
  process.exit(1);
}

async function getCatalogs() {
  try {
    console.log('🔍 Récupération des catalogues Zelty...\n');

    const response = await fetch(`${ZELTY_API_BASE}/catalogs`, {
      headers: {
        'Authorization': `Bearer ${ZELTY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API Zelty [${response.status}]: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Catalogues trouvés:\n');
    
    if (Array.isArray(data.catalogs)) {
      data.catalogs.forEach((catalog, index) => {
        console.log(`${index + 1}. ${catalog.name || 'Sans nom'}`);
        console.log(`   UUID: ${catalog.id}`);
        console.log(`   Restaurant ID: ${catalog.id_restaurant || 'N/A'}`);
        console.log(`   Virtual Brand: ${catalog.virtual_brand_name || 'N/A'}`);
        console.log('');
      });

      console.log('\n📝 Commandes SQL pour mettre à jour Supabase:\n');
      
      data.catalogs.forEach((catalog) => {
        const virtualBrand = catalog.virtual_brand_name;
        if (virtualBrand) {
          const slug = virtualBrand.toLowerCase();
          console.log(`UPDATE tenants SET zelty_catalog_id = '${catalog.id}'::uuid WHERE slug = '${slug}';`);
        }
      });
    } else {
      console.log('Structure de réponse:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

getCatalogs();

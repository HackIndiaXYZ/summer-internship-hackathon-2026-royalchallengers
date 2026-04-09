const axios = require('axios');

const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreCandidate(productName, candidateName, candidateBrand) {
  const query = normalizeText(productName);
  const name = normalizeText(candidateName);
  const brand = normalizeText(candidateBrand);

  if (!query || !name) return 0;

  const queryTokens = query.split(' ').filter(Boolean);
  let tokenHits = 0;

  for (const token of queryTokens) {
    if (name.includes(token) || brand.includes(token)) tokenHits += 1;
  }

  const coverage = tokenHits / Math.max(queryTokens.length, 1);
  const exactBonus = name === query ? 0.25 : 0;
  const includesBonus = name.includes(query) ? 0.15 : 0;

  return Math.min(1, coverage + exactBonus + includesBonus);
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function firstNonNull(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') {
      return value;
    }
  }
  return null;
}

function pickNutrition(nutriments = {}) {
  const sodiumG = toNumber(firstNonNull(
    nutriments.sodium_100g,
    nutriments.sodium_value && nutriments.sodium_unit === 'g' ? nutriments.sodium_value : null
  ));

  const saltDirect = toNumber(firstNonNull(
    nutriments.salt_100g,
    nutriments.salt_value && nutriments.salt_unit === 'g' ? nutriments.salt_value : null
  ));

  // If only sodium is available, convert to salt equivalent (NaCl) using 2.5 multiplier.
  const saltFromSodium = sodiumG !== null ? Number((sodiumG * 2.5).toFixed(2)) : null;

  return {
    calories: toNumber(firstNonNull(nutriments['energy-kcal_100g'], nutriments.energy_kcal_100g)),
    fat: toNumber(firstNonNull(nutriments.fat_100g, nutriments.fat_value)),
    sugar: toNumber(firstNonNull(nutriments.sugars_100g, nutriments.sugars_value)),
    salt: firstNonNull(saltDirect, saltFromSodium),
    protein: toNumber(firstNonNull(nutriments.proteins_100g, nutriments.proteins_value)),
    carbohydrates: toNumber(firstNonNull(nutriments.carbohydrates_100g, nutriments.carbohydrates_value))
  };
}

function nutritionCompleteness(nutrition) {
  const values = [
    nutrition.calories,
    nutrition.fat,
    nutrition.sugar,
    nutrition.salt,
    nutrition.protein,
    nutrition.carbohydrates
  ];

  return values.filter(v => v !== null && v !== undefined).length;
}

function pickIngredientText(product) {
  return (
    product.ingredients_text_en ||
    product.ingredients_text ||
    product.ingredients_text_with_allergens_en ||
    product.ingredients_text_with_allergens ||
    ''
  );
}

async function lookupProductOnWeb(productName, productCategory = 'Food') {
  if (!productName || productName === 'Unknown Product') {
    return null;
  }

  try {
    const response = await axios.get(OFF_SEARCH_URL, {
      params: {
        search_terms: productName,
        search_simple: 1,
        action: 'process',
        json: 1,
        page_size: 12,
        sort_by: 'unique_scans_n'
      },
      timeout: 8000
    });

    const products = Array.isArray(response?.data?.products) ? response.data.products : [];
    if (products.length === 0) return null;

    let best = null;
    let bestScore = -1;

    for (const candidate of products) {
      const score = scoreCandidate(productName, candidate.product_name, candidate.brands);
      const nutrition = pickNutrition(candidate.nutriments || {});
      const completeness = nutritionCompleteness(nutrition);
      const finalScore = score + completeness * 0.02;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        best = { candidate, nutrition };
      }
    }

    if (!best) return null;

    const guessedIngredients = pickIngredientText(best.candidate);
    const normalizedCategory = normalizeText(productCategory);
    const categoryText = normalizeText(best.candidate.categories || best.candidate.categories_tags?.join(' ') || '');
    const likelyCategoryMatch = !normalizedCategory || !categoryText || categoryText.includes(normalizedCategory);

    return {
      guessed_ingredients: guessedIngredients || '',
      nutrition: best.nutrition,
      is_specific_match: bestScore >= 0.45,
      confidence_score: Number(Math.max(0, Math.min(1, bestScore)).toFixed(2)),
      source: 'open_food_facts',
      likely_category_match: likelyCategoryMatch,
      product_name: best.candidate.product_name || null,
      brand: best.candidate.brands || null
    };
  } catch (err) {
    console.warn('[WebSearch] OFF lookup failed:', err.message);
    return null;
  }
}

module.exports = { lookupProductOnWeb };

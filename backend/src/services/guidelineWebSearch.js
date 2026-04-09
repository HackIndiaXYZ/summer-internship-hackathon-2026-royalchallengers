const axios = require('axios');

const WIKI_SEARCH_URL = 'https://en.wikipedia.org/w/api.php';
const wikiContactEmail = process.env.WIKI_CONTACT_EMAIL || 'support@medoveda.org';
const WIKI_HEADERS = {
  'User-Agent': `MedoVedaGuidelineBot/1.0 (health-research; ${wikiContactEmail})`,
  Accept: 'application/json'
};

const CACHE_MAX_ENTRIES = 500;
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const guidelineCache = new Map();

function cacheGet(key) {
  const entry = guidelineCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    guidelineCache.delete(key);
    return null;
  }

  // LRU refresh
  guidelineCache.delete(key);
  guidelineCache.set(key, entry);
  return entry.value;
}

function cacheSet(key, value) {
  if (!key) return;

  if (guidelineCache.has(key)) {
    guidelineCache.delete(key);
  }

  guidelineCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  });

  while (guidelineCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = guidelineCache.keys().next().value;
    if (!oldestKey) break;
    guidelineCache.delete(oldestKey);
  }
}

function cleanSentence(text = '') {
  const normalized = String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .trim();

  if (!normalized) return '';

  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;
  return firstSentence.slice(0, 160).trim();
}

function toShortReason(summary = '', ingredient = '') {
  const ingredientLower = String(ingredient || '').toLowerCase();
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'of', 'to', 'in', 'for',
    'and', 'or', 'with', 'as', 'on', 'by', 'from', 'that', 'this', 'it',
    'also', 'known', 'used', 'widely'
  ]);

  const words = String(summary || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length > 2)
    .filter((w) => !stopWords.has(w))
    .filter((w) => !ingredientLower.includes(w));

  const selected = words.slice(0, 6);
  if (selected.length >= 5) {
    return selected.join(' ');
  }

  return 'limit frequent use monitor health response';
}

function normalizeIngredientName(value = '') {
  return String(value || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\d+\s*%/g, ' ')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value = '') {
  return new Set(
    String(value || '')
      .toLowerCase()
      .split(/\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 3)
  );
}

function isRelevantResult(ingredient, title, summary) {
  const ingredientTokens = tokenSet(ingredient);
  if (ingredientTokens.size === 0) return false;

  const combined = `${String(title || '')} ${String(summary || '')}`.toLowerCase();
  let matches = 0;
  for (const token of ingredientTokens) {
    if (combined.includes(token)) matches += 1;
  }
  return matches >= 1;
}

async function searchWikipediaTitles(query, limit = 3) {
  const res = await axios.get(WIKI_SEARCH_URL, {
    params: {
      action: 'query',
      list: 'search',
      srsearch: query,
      format: 'json',
      utf8: 1,
      srlimit: limit
    },
    headers: WIKI_HEADERS,
    timeout: 3500
  });

  const rows = Array.isArray(res?.data?.query?.search) ? res.data.query.search : [];
  return rows.map((row) => row?.title).filter(Boolean);
}

async function fetchWikipediaSummary(title) {
  if (!title) return null;

  const res = await axios.get(WIKI_SEARCH_URL, {
    params: {
      action: 'query',
      prop: 'extracts',
      exintro: 1,
      explaintext: 1,
      format: 'json',
      redirects: 1,
      titles: title
    },
    headers: WIKI_HEADERS,
    timeout: 3500
  });

  const pages = res?.data?.query?.pages || {};
  const page = Object.values(pages)[0] || {};
  return cleanSentence(page?.extract || '');
}

async function findGuidelineLineForIngredient(ingredientName = '') {
  const ingredient = normalizeIngredientName(ingredientName);
  if (!ingredient) return null;

  const cacheKey = ingredient.toLowerCase();
  const cachedValue = cacheGet(cacheKey);
  if (cachedValue) return cachedValue;

  const searches = [
    { authority: 'Wikipedia', query: `${ingredient}` },
    { authority: 'Wikipedia', query: `${ingredient} ingredient` },
    { authority: 'Wikipedia', query: `${ingredient} FSSAI food additive guideline India` },
    { authority: 'Wikipedia', query: `${ingredient} WHO food additive safety` },
    { authority: 'Wikipedia', query: `${ingredient} food` }
  ];

  for (const item of searches) {
    try {
      const titles = await searchWikipediaTitles(item.query, 4);
      for (const title of titles) {
        const summaryLine = await fetchWikipediaSummary(title);
        if (!summaryLine) continue;
        if (!isRelevantResult(ingredient, title, summaryLine)) continue;

        const line = toShortReason(summaryLine, ingredient);
        cacheSet(cacheKey, line);
        return line;
      }
    } catch (err) {
      console.error(`[GuidelineWebSearch] Source failed (${item.authority} | ${item.query}):`, err?.stack || err?.message || err);
    }
  }

  const fallback = 'limit frequent use monitor health response';
  cacheSet(cacheKey, fallback);
  return fallback;
}

async function enhanceIngredientGuidelines(rows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const enrichedRows = [];

  for (const row of safeRows) {
    const line = await findGuidelineLineForIngredient(row?.name || '');
    enrichedRows.push({
      ...row,
      standardGuideline: line || row?.standardGuideline || '[General Caution]: No verified numeric guideline available.'
    });
  }

  return enrichedRows;
}

module.exports = {
  enhanceIngredientGuidelines
};

# Log Templates
## Copy-Paste Diagnostic Logs for Medo Veda

Add these logs temporarily when debugging. Remove after fix is confirmed.
Never commit diagnostic logs to production.

---

## Pipeline timing logs (add to orchestrator.js)

```javascript
const pipelineStart = Date.now()
console.log('[PIPELINE START]', new Date().toISOString())

// After Wave 1
console.log('[WAVE_1_DONE]', Date.now() - pipelineStart, 'ms')

// After Wave 2A and 2B
console.log('[WAVE_2A_DONE]', Date.now() - pipelineStart, 'ms')
console.log('[WAVE_2B_DONE]', Date.now() - pipelineStart, 'ms')

// After Verdict
console.log('[VERDICT_DONE]', Date.now() - pipelineStart, 'ms')

// Final
console.log('[PIPELINE_TOTAL]', Date.now() - pipelineStart, 'ms')
```

---

## Agent call timing (add to nvidiaClient.js callAgent function)

```javascript
const agentStart = Date.now()
console.log(`[${agentName}] START model=${assignment.model}`)
// ... API call ...
console.log(`[${agentName}] DONE ${Date.now() - agentStart}ms tokens=${maxTokens}`)
```

---

## OCR output log (add to visionService.js)

```javascript
console.log('[OCR RAW RESULT]', JSON.stringify({
  productName: ocrResult.productName,
  brand: ocrResult.brand,
  ingredientsRawLength: ocrResult.ingredientsRaw?.length,
  ingredientsRawPreview: ocrResult.ingredientsRaw?.slice(0, 200),
  nutritionRawLength: ocrResult.nutritionRaw?.length,
  claimsRawPreview: ocrResult.claimsRaw?.slice(0, 100),
  confidence: ocrResult.confidence,
  ocrSource: ocrResult.ocrSource
}, null, 2))
```

---

## Product agent log (add to productAgent.js)

```javascript
// Before API call
console.log('[PRODUCT AGENT INPUT]', userPrompt.slice(0, 300))

// After API call
console.log('[PRODUCT AGENT OUTPUT]', JSON.stringify(result, null, 2))

// Check for placeholder name
if (!result?.productName || result.productName === 'product name') {
  console.error('[PRODUCT AGENT ERROR] Returned placeholder name!', result)
}
```

---

## Ingredient agent log (add to ingredientAgent.js)

```javascript
// Before API call
console.log('[INGREDIENT AGENT] Processing', ocrResult.ingredientsRaw?.length, 'chars of ingredients')

// After API call
console.log('[INGREDIENT AGENT]', {
  count: result?.ingredients?.length,
  overallRisk: result?.overallRiskLevel,
  topConcerns: result?.topConcerns,
  sample: result?.ingredients?.slice(0, 2)
})

// Empty check
if (!result?.ingredients?.length) {
  console.error('[INGREDIENT AGENT ERROR] Empty ingredients returned!')
  console.error('[INGREDIENT AGENT] Input was:', ocrResult.ingredientsRaw?.slice(0, 500))
}
```

---

## Redis cache logs (add to scan routes)

```javascript
// Before cache check
console.log('[CACHE CHECK]', cacheKey)

// After cache check
if (cached) {
  console.log('[CACHE HIT]', cacheKey)
} else {
  console.log('[CACHE MISS]', cacheKey, '— running pipeline')
}

// After saving to cache
console.log('[CACHE SET]', cacheKey, '24hr TTL')
```

---

## Route async response logs (add to scan.js)

```javascript
// When scanId is returned
console.log('[SCAN ROUTE] Returning scanId to frontend:', scanId)
console.log('[SCAN ROUTE] Time to first response:', Date.now() - requestStart, 'ms')
res.status(202).json({ scanId, status: 'processing' })
console.log('[SCAN ROUTE] Response sent. Pipeline starting async.')

// When pipeline completes async
console.log('[SCAN ROUTE] Async pipeline complete for', scanId)
console.log('[SCAN ROUTE] Total scan time:', Date.now() - requestStart, 'ms')
```

---

## Frontend data flow logs (add to ReportPage.jsx or ScanPage.jsx)

```javascript
// In Report page when result loads
console.log('[REPORT DATA RECEIVED]', {
  productName: result?.productName,
  brand: result?.brand,
  ingredientCount: result?.ingredients?.length,
  verdict: result?.verdict,
  nutritionCalories: result?.nutrition?.calories,
  claimCount: result?.claims?.length
})

// Check for obvious data issues
if (!result?.productName) {
  console.error('[REPORT] Missing productName in result!')
}
if (!result?.ingredients?.length) {
  console.error('[REPORT] Empty ingredients in result!')
}
if (result?.nutrition?.calories === 0) {
  console.warn('[REPORT] Calories is 0 — may be wrong default, check if null expected')
}
```

---

## Open Food Facts nutrition log (add to openFoodFacts.js)

```javascript
// After fetching product
console.log('[OFF API] Raw nutriments:', JSON.stringify(product.nutriments, null, 2))

// After extraction
console.log('[OFF API] Extracted nutrition:', {
  calories: product.nutriments?.['energy-kcal_100g'],
  fat: product.nutriments?.['fat_100g'],
  sugar: product.nutriments?.['sugars_100g'],
  salt: product.nutriments?.['salt_100g'],
  protein: product.nutriments?.['proteins_100g']
})
```

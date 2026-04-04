# Anti-Patterns Reference
## Common Wrong Approaches — What to Do Instead

This file documents the most common wrong debugging approaches seen in the
Medo Veda project, and the correct approach for each.

---

## ANTI-PATTERN 1 — Treating the symptom, not the cause

### Wrong approach
```
Bug: productName shows as "product name" in the report
Wrong fix: In ReportPage.jsx, add:
  const displayName = result.productName === 'product name' ? '' : result.productName
```
This hides the bug. The data is still wrong. Every downstream consumer of
productName will also get wrong data (history page, dashboard, etc.).

### Correct approach
Find where "product name" is written:
1. Log `[PRODUCT AGENT OUTPUT]` to confirm agent is returning "product name"
2. Open productAgent.js system prompt
3. Find the example JSON — it probably says `"productName": "product name"`
4. Replace with a clearly fictional example: `"productName": "Actual Product Name Here"`
5. Add instruction: "Extract the real product name from the input text. Never
   return the string 'product name' or 'unknown'."

---

## ANTI-PATTERN 2 — Increasing timeouts instead of fixing latency

### Wrong approach
```
Bug: AxiosError timeout 120000ms exceeded
Wrong fix: Change timeout to 300000 (5 minutes)
```
The pipeline still takes 90-120 seconds. The timeout just hides it longer.
Users wait 2-5 minutes for a report. This is not a fix.

### Correct approach
1. Add timing logs to every agent call
2. Confirm whether agents run sequentially or in parallel
3. Fix orchestrator.js to use Promise.all for independent agents
4. Make scan route return res.json({ scanId }) BEFORE calling runPipeline()
5. Frontend polls for result instead of waiting for one long HTTP response

---

## ANTI-PATTERN 3 — Returning empty/fake data on failure

### Wrong approach
```
Bug: OCR returns empty text for some images
Wrong fix: if (!ingredients.length) { ingredients = ['Water', 'Salt'] }
```
Users see fake data presented as real. They make health decisions on
fabricated ingredient lists. This is dangerous for a health platform.

### Correct approach
1. Log the raw OCR output to see what was actually extracted
2. If OCR failed, return a specific error message to the frontend:
   "Could not extract ingredient text from this image.
    Please try a clearer photo or use Text input."
3. Show the user two buttons: "Retake Photo" and "Type Instead"
4. Never show fake data as real data

---

## ANTI-PATTERN 4 — Fixing the consumer instead of the producer

### Wrong approach
```
Bug: Nutrition values show as 0 in the report
Wrong fix: In ReportPage.jsx, display "—" when value is 0
```
This makes zeros look like nulls visually, but the underlying data is wrong.
If something later queries the database for products with 0 calories,
it will get wrong results.

### Correct approach
1. Log the raw Open Food Facts API response for the barcode
2. Check `product.nutriments` — are the values there?
3. Check the field names — Open Food Facts uses `energy-kcal_100g` with hyphens
4. Fix the extraction in openFoodFacts.js to use bracket notation:
   `nutriments['energy-kcal_100g']` not `nutriments.energy-kcal_100g`
5. For null values (not available), store null in database, display "—" in UI

---

## ANTI-PATTERN 5 — Changing multiple things at once

### Wrong approach
```
Bug: Pipeline is slow
Wrong fix: Change orchestrator.js, nvidiaClient.js, visionService.js,
           and all agent files simultaneously in one large PR
```
When something breaks after this change, you cannot tell which file caused it.
You have to revert everything and start over.

### Correct approach
1. Add timing logs first (no functional change)
2. Run once to identify the slowest component
3. Fix ONLY the slowest component
4. Test again — is it faster?
5. If yes, move to the next bottleneck
6. Never change more than one system at a time when debugging performance

---

## ANTI-PATTERN 6 — Assuming without confirming

### Wrong approach
```
Bug: Ingredients list is empty
Wrong assumption: "The NVIDIA API must be timing out on the ingredient agent"
Wrong fix: Increase max_tokens for ingredient agent without checking if that's the issue
```

### Correct approach
1. Log `[INGREDIENTS_RAW]` from OCR output
2. Log `[INGREDIENT AGENT INPUT]` before the API call
3. Log `[INGREDIENT AGENT OUTPUT]` after the API call
4. Now you have data. What does it show?
   - If ingredientsRaw is empty: OCR is the problem, not the ingredient agent
   - If input has data but output is null: NVIDIA API call is failing
   - If output has data but report shows empty: presentationAgent or frontend is losing it
5. Only fix what the logs confirm is broken

---

## ANTI-PATTERN 7 — Catch-all error handling that hides bugs

### Wrong approach
```javascript
// In orchestrator.js
try {
  const result = await runPipeline(...)
  return result
} catch (err) {
  console.error(err)
  return { verdict: 'limit', ingredients: [], productName: 'Unknown' }
}
```
Every pipeline failure silently returns fake data. The user sees a report.
The developer never knows the pipeline crashed. Bugs accumulate invisibly.

### Correct approach
```javascript
try {
  const result = await runPipeline(...)
  return result
} catch (err) {
  console.error('[PIPELINE ERROR]', err.message, err.stack)
  // Propagate to scan route which handles user-facing error
  throw err
}
// In scan route:
} catch (err) {
  setStatus(scanId, {
    complete: true,
    error: 'Analysis failed: ' + err.message
  })
}
// Frontend shows specific error, not fake data
```

---

## DECISION TREE — Which file to open first

```
Error appears in frontend console?
  Yes → Read the stack trace. Find the first line with your code filename.
         Open THAT file. Not the file above it in the stack.
  No  → Check the backend server logs first.

Timeout error?
  Yes → Is it in the frontend (AxiosError) or backend (NVIDIA NIM timeout)?
        Frontend timeout → scan route is not returning scanId early enough
        Backend NVIDIA timeout → agent is using too many tokens or sequential awaits

Wrong data in report?
  Yes → Add console.log at EACH of these points and run a scan:
        1. After OCR (ocrResult)
        2. After Product Agent
        3. After Ingredient Agent
        4. After Presentation Agent
        5. In Report page component (received data)
        The FIRST point where data is wrong is the root cause.

Empty array or null where data is expected?
  Yes → Find the function that CREATES this data, not the function that USES it.
        Add a log right before the function returns.
        If it returns null/empty, the bug is inside that function.
        If it returns real data, the bug is in how the caller uses it.
```

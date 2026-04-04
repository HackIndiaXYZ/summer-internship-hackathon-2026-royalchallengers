---
name: root-cause-debug
description: >
  Use this skill whenever a bug is not getting fixed, wrong outputs keep coming back,
  the agent is applying workarounds instead of real fixes, symptoms are being treated
  instead of root causes, or the same error appears repeatedly despite multiple fix
  attempts. Trigger this skill when you hear phrases like "it's still not working",
  "same error again", "the fix didn't help", "it's giving wrong results", "still timing
  out", "it keeps breaking", or any situation where a previous fix failed or the agent
  is guessing instead of diagnosing. This skill forces a strict diagnosis-first workflow
  that prevents wrong outputs, prevents strategy-guessing, and forces the agent to find
  and fix the actual root cause before writing any code. Use this for ALL debugging
  sessions in the Medo Veda project — especially pipeline issues, NVIDIA NIM timeout
  errors, ingredient extraction failures, wrong product names, and report generation bugs.
---

# Root Cause Debug Skill
## For Medo Veda — IDE Agent Discipline Framework

This skill enforces a strict debugging protocol. The agent MUST follow every
step in order. No skipping. No guessing. No writing code before diagnosis is complete.

---

## CORE RULE — THE ONLY RULE THAT MATTERS

**Diagnose before you fix. Always.**

If you do not know EXACTLY which line of code is causing the problem,
you are not ready to fix it. Write no code until you can answer:

1. Which file contains the bug?
2. Which function in that file?
3. Which line or block?
4. Why does that line cause this symptom?

If you cannot answer all four, keep diagnosing.

---

## PHASE 1 — STOP AND READ THE ERROR FIRST

When a bug is reported, do this before anything else:

### 1.1 Read the full error message

Copy the complete error into your analysis. Do not paraphrase it.
Every part of the error message is data:

- **Error type** — what kind of failure (timeout, parse error, null reference, etc.)
- **Error message** — the specific description
- **File and line number** — where it was thrown (not where it was caught)
- **Stack trace** — the call chain leading to the error
- **Timestamp** — when it happened
- **Request context** — what the user was doing when it happened

### 1.2 Identify the failure point

The failure point is the FIRST place in the stack trace that belongs
to YOUR code — not a library, not Node internals, not axios internals.

Example:
```
AxiosError: timeout of 120000ms exceeded
  at handleImageUpload (ScanPage.jsx:81)   ← THIS IS YOUR CODE
  at axios/lib/adapters/http.js:300         ← this is axios internals
```

The failure point here is `ScanPage.jsx:81` — not axios. Axios is just
reporting what your code triggered.

### 1.3 State the hypothesis

Before opening any file, write one sentence:
"I believe the bug is in [file], [function], because [reason]."

If you cannot write this sentence, you need more information. Ask for it.

---

## PHASE 2 — TRACE THE DATA FLOW

Do not assume. Trace.

### 2.1 Follow the data from input to failure

Start from where the user action begins and follow every function call
until you reach the failure point. Write the chain:

```
User taps Analyse button
  → handleImageUpload() in ScanPage.jsx
  → api.post('/api/scan/image', formData, { timeout: 120000 })
  → Backend receives at POST /api/scan/image in scan.js
  → runPipeline() called synchronously ← pipeline takes 90-120 seconds
  → axios timeout fires at 120 seconds ← error thrown here
  → catch block catches AxiosError
  → console.error shown to user
```

This chain makes the root cause obvious: the backend is not responding
quickly because the pipeline runs synchronously before any response is sent.

### 2.2 Identify WHERE in the chain it breaks

Mark the exact break point with a comment in your analysis:
```
→ runPipeline() called synchronously ← ROOT CAUSE IS HERE
```

### 2.3 Confirm the data at each step

For each step in the chain, ask:
- What is the value of the key variable at this point?
- Is it what it should be?
- If not, this is where something went wrong

Add console.log statements to confirm your hypothesis BEFORE writing any fix.
Never remove these until the fix is confirmed working.

---

## PHASE 3 — CLASSIFY THE BUG

Before writing a fix, classify what type of bug this is.
Different bug types require different fix strategies.

### Bug Type Classification

| Type | Description | Fix Strategy |
|---|---|---|
| Architecture bug | The design itself is wrong (e.g., sync where async needed) | Redesign the affected flow |
| Logic bug | Code does the wrong thing (wrong condition, wrong calculation) | Fix the specific logic |
| Data bug | Wrong data enters a function (null, wrong format, missing field) | Fix data at the source, not where it's consumed |
| Async bug | Promises, callbacks, or timing are mishandled | Fix the async pattern |
| Configuration bug | Wrong env var, wrong URL, wrong timeout value | Fix the config |
| Integration bug | Two systems talk incorrectly (wrong API format, wrong headers) | Fix the contract between systems |
| Missing null check | Code assumes data exists but it doesn't | Add guard at the point where null enters, not where it crashes |

### Critical rule for Data Bugs

If a function receives bad data (null, wrong format), **do not fix it inside
that function**. Find where the bad data was created or passed and fix it there.
Fixing where it crashes is a workaround, not a fix.

Example:
```
productName shows as "product name" in the report
  ↓ Wrong fix: add a check in the Report page to replace "product name" with ""
  ↓ Right fix: find where productAgent.js writes "product name" and fix the prompt
```

---

## PHASE 4 — WRITE THE MINIMUM FIX

Once root cause is confirmed, write the SMALLEST possible fix.

### Rules for writing the fix

**Rule 1 — Change only what is broken.**
Do not refactor, rename, or improve anything that is not part of the bug.
Every unnecessary change is a new opportunity to introduce another bug.

**Rule 2 — Fix the cause, never the symptom.**
If data is wrong at step 5, fix it at step 2 where it went wrong.
Never add a patch at step 5 to work around the wrong data.

**Rule 3 — One fix per bug.**
If you find multiple problems, fix them one at a time in separate changes.
Batching fixes makes it impossible to know which fix worked.

**Rule 4 — Explain the fix before writing it.**
Write one paragraph explaining:
- What the root cause was
- Why this fix addresses the root cause
- What specifically will be different after the fix

If you cannot write this paragraph, you do not understand the fix yet.

**Rule 5 — Preserve existing behavior.**
The fix must not change anything that was working before.
If you change a function signature, check every caller.
If you change a data format, check every consumer.

---

## PHASE 5 — VERIFY THE FIX

Never mark a bug as fixed until you have verified it.

### Verification checklist

**Step 1 — Reproduce the bug first (before the fix).**
Confirm you can trigger the exact error on demand.
If you cannot reproduce it, you cannot verify the fix.

**Step 2 — Apply the fix.**

**Step 3 — Reproduce the scenario.**
Do exactly what caused the bug before. The error must not appear.

**Step 4 — Check adjacent behavior.**
Test the behavior that was working before. It must still work.
A fix that breaks something else is not a fix.

**Step 5 — Check the specific output.**
For Medo Veda bugs, verify these specific outputs:
- productName: must be the real product name, not "product name" or empty
- ingredients: must list all ingredients from the label, not an empty array
- verdict: must be "safe", "limit", or "avoid" — not null or undefined
- nutrition values: must be numbers or null, never 0 as a default
- pipeline: must complete, no timeout error
- report: must render in the browser with real data visible

**Step 6 — Check console logs.**
No new errors should appear in the console after the fix.
Existing errors that were unrelated must still be investigated separately.

---

## PHASE 6 — MEDO VEDA SPECIFIC DEBUG RULES

These rules apply specifically to the Medo Veda project.

### Pipeline timeout debugging protocol

When the pipeline times out:

1. First — add timing logs to EVERY agent call:
   ```
   console.time('[agent_name]')
   const result = await callAgent(...)
   console.timeEnd('[agent_name]')
   ```
   Run ONE scan and look at the logs. The slowest agent is the problem.

2. Second — confirm whether agents are sequential or parallel.
   Check orchestrator.js for Promise.all vs sequential awaits.
   If you see this pattern, agents are sequential (wrong):
   ```
   const a = await agentOne()
   const b = await agentTwo()
   const c = await agentThree()
   ```
   It must be this pattern for independent agents (correct):
   ```
   const [a, b] = await Promise.all([agentOne(), agentTwo()])
   ```

3. Third — confirm the scan route returns scanId BEFORE the pipeline runs.
   The route handler must send `res.json({ scanId })` BEFORE calling `runPipeline()`.
   If `runPipeline()` is called before `res.json()`, the frontend waits for the
   entire pipeline — this is always the cause of timeout errors in this project.

4. Fourth — confirm Redis cache check happens BEFORE pipeline execution.
   Add console.log('[CACHE CHECK]') before the cache lookup.
   Add console.log('[CACHE HIT]') or '[CACHE MISS]' after.
   If you see '[CACHE MISS]' on every request including repeats, cache is broken.

### Wrong product name debugging protocol

When productName shows as "product name", "unknown", or empty:

1. Log the raw OCR output BEFORE it enters the pipeline:
   ```
   console.log('[OCR RESULT]', JSON.stringify(ocrResult, null, 2))
   ```
   Check: is the OCR text actually populated? Is product_name_guess set?

2. Log the Product Agent input and output:
   ```
   console.log('[PRODUCT AGENT INPUT]', userPrompt)
   console.log('[PRODUCT AGENT OUTPUT]', result)
   ```
   Check: is the agent receiving the OCR text? Is it returning a real name?

3. Check the agent system prompt.
   Find the example JSON in the prompt. If it shows `"productName": "product name"`
   as an example, the model is copying the example literally. Fix the example.

4. Check the frontend is reading from the correct field path.
   Add `console.log('[REPORT DATA]', result)` in the Report page component.
   Find exactly where productName lives in the JSON and match the field path.

### Empty ingredient list debugging protocol

When ingredients shows as [] or missing:

1. Log the ingredientsRaw from OCR:
   ```
   console.log('[INGREDIENTS RAW]', ocrResult.ingredientsRaw)
   ```
   If this is empty, the OCR failed to find the ingredients section.
   The fix is in visionService.js, not ingredientAgent.js.

2. If ingredientsRaw is populated, log the ingredient agent output:
   ```
   console.log('[INGREDIENT AGENT]', JSON.stringify(result, null, 2))
   ```
   If result.ingredients is empty but ingredientsRaw had text,
   the agent prompt is failing to parse the list. Fix the prompt.

3. If ingredient agent returns ingredients but report shows none,
   the bug is in presentationAgent.js or the frontend field path.
   Log presentationAgent input and output to find where ingredients disappear.

### Zero nutrition values debugging protocol

When calories, fat, sugar show as 0:

1. Check if Open Food Facts returned nutrition data (barcode input):
   ```
   console.log('[OFF NUTRITION]', product.nutriments)
   ```
   Open Food Facts uses bracket notation keys like `nutriments['energy-kcal_100g']`.
   Dot notation `nutriments.energy-kcal_100g` will fail on hyphens.
   Always use bracket notation.

2. Check if OCR extracted the nutrition section (image input):
   ```
   console.log('[NUTRITION RAW]', ocrResult.nutritionRaw)
   ```
   If empty, the nutrition table was not visible or not extracted.
   The frontend must show "—" not "0" for null nutrition values.

3. Check the final JSON schema from presentationAgent:
   Find where nutrition is set. If it defaults to 0 instead of null,
   fix the default value. Zero means "zero grams". Null means "unknown".
   These are not the same.

---

## PHASE 7 — FORBIDDEN ACTIONS

These actions are banned. If you are about to do any of these, stop.
Come back to Phase 1 and re-diagnose.

### Never do these

**BANNED: Wrapping a bug in a try-catch to hide it.**
A crash caught and swallowed is still a crash. The user still gets wrong output.

**BANNED: Adding a fallback that returns fake data.**
If an agent returns null, do not silently return a fabricated ingredient list.
Surface the error. Show the user what happened.

**BANNED: Changing a component that was not causing the bug.**
If the report page shows the wrong product name, do not change the report page
unless you have confirmed the product name is correct in the data being passed to it.

**BANNED: Increasing a timeout to make an error go away.**
A timeout that was 120 seconds and a timeout that is 300 seconds both fail.
Increasing the timeout is not a fix for slow code. Find why it is slow.

**BANNED: Adding a `.catch(() => {})` to suppress an error.**
If an async call is throwing, you must handle or fix it. Suppressing it
means you will never know when it breaks in production.

**BANNED: Returning a hardcoded string when extraction fails.**
If OCR fails to find a product name, do not return "Product". Return an error.
Let the user know extraction failed. Give them a path to fix it.

**BANNED: Fixing one bug by introducing a workaround elsewhere.**
Every workaround becomes permanent. Fix the source.

---

## QUICK REFERENCE — DEBUGGING CHECKLIST

Use this before writing any fix:

```
□ I have read the complete error message including stack trace
□ I have identified the exact file and line where the failure originates
□ I have traced the data flow from user action to failure point
□ I have written: "The root cause is [X] in [file] at [line] because [reason]"
□ I have classified the bug type (architecture / logic / data / async / config)
□ I have added console.log statements to confirm my hypothesis
□ I have confirmed the hypothesis by running the code and seeing the expected logs
□ I have written one paragraph explaining what the fix does and why it works
□ I am changing only the minimum code needed to fix this specific bug
□ I have a test to verify the fix works
□ I have confirmed adjacent behavior still works
```

If any box is unchecked, do not write the fix yet.

---

## MEDO VEDA PROJECT CONTEXT

Key files to check when debugging this project:

| Symptom | First file to check |
|---|---|
| Timeout on image upload | backend/src/routes/scan.js — is res.json sent before runPipeline? |
| Pipeline takes 90+ seconds | backend/src/pipeline/orchestrator.js — are agents sequential? |
| Wrong product name | backend/src/agents/productAgent.js — check the system prompt example |
| Empty ingredients | backend/src/services/visionService.js — check ingredientsRaw in OCR output |
| Zero nutrition values | backend/src/services/openFoodFacts.js — check bracket notation on nutriments |
| Report shows "product name" | backend/src/agents/productAgent.js — the prompt example is being copied |
| History shows no names | backend/src/routes/history.js — check the SQL query extracts product name |
| Cache not working | backend/src/lib/redis.js — check redis.ping() succeeds at startup |
| NVIDIA API timeout | backend/src/lib/nvidiaClient.js — check per-agent timeout and max_tokens |
| Frontend stuck on scan page | frontend/src/pages/ScanPage.jsx — handler must navigate after receiving scanId |

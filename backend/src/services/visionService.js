const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * CLINICAL VISION PIPELINE (V7.0 — Full OCR + Analysis Rewrite)
 * 
 * This is the ONLY point in the pipeline where the image is read.
 * The prompt must extract EVERYTHING from the label in a single pass:
 *   - Product name (from largest text on label)
 *   - Brand name
 *   - Full ingredients list
 *   - Nutrition facts table
 *   - All marketing claims, health claims, certifications
 * 
 * All downstream agents (ingredient, claims, alternatives, verdict)
 * work from the data extracted here. If this fails, everything fails.
 */
async function processProductImage(imageInput) {
  const startTime = Date.now();
  const isUrl = typeof imageInput === 'string' && imageInput.startsWith('http');
  const imageRef = isUrl ? imageInput : imageInput;

  // ══════════════════════════════════════════════════════════════
  // PART 1 — OCR INSTRUCTION (reads the image)
  // ══════════════════════════════════════════════════════════════
  const ocrInstruction = `You are a clinical OCR agent. Read every piece of text visible in this product label image. 
  
CRITICAL: Do NOT use prior knowledge about what a product might contain. Only return what is physically printed on the label in the image.

Read: the product name, brand, ingredients list, nutrition facts table, and all marketing claims or certifications.
Start with the largest text — usually the product name. Then extract the ingredients list (usually follows "Ingredients:"). Then the nutrition table. Then any health claims.`;

  // ══════════════════════════════════════════════════════════════
  // PART 2 — NON-FOOD CHECK
  // ══════════════════════════════════════════════════════════════
  const nonFoodCheck = `First determine if this image shows a food product label. If it does NOT show a food, beverage, or dietary supplement label, return ONLY this JSON:
{
  "living_being": true,
  "category": "Non-Food",
  "product_name": "Non-Food Item",
  "reason": "one sentence explaining what you see instead"
}
If it IS a food product label, continue with the full analysis below.`;

  // ══════════════════════════════════════════════════════════════
  // PART 3 — EXTRACTION INSTRUCTIONS
  // ══════════════════════════════════════════════════════════════
  const extractionInstructions = `PRODUCT NAME EXTRACTION:
Return the exact text of the product name exactly as it is printed on the label. Do not guess. Do not use generic names. If you cannot read ANY text in the image, return "UNREADABLE_SPECIMEN". 

INGREDIENT EXTRACTION:
Extract every single ingredient exactly as printed. Do not add ingredients that are not on this label. If the ingredients list is blocked or unreadable, return null for the ingredients field.

NUTRITION EXTRACTION:
Extract per 100g values. If a value is missing, return null. Never return 0 as a default.

MARKETING CLAIMS:
Extract only the physically printed text of marketing claims (e.g. "Low Fat", "No Added Sugar").`;

  // ══════════════════════════════════════════════════════════════
  // PART 4 — QUALITY CHECK
  // ══════════════════════════════════════════════════════════════
  const qualityCheck = `IMAGE QUALITY CHECK:
If the image is blurry, low-light, or text is unreadable, set "extraction_quality": "low" and "needs_research": true.
If text is crystal clear, set "extraction_quality": "high" and "needs_research": false.`;

  // ══════════════════════════════════════════════════════════════
  // PART 5 — ANTI-HALLUCINATION RULES
  // ══════════════════════════════════════════════════════════════
  const antiHallucination = `Rules you must follow without exception:
1. If text is unreadable, report extraction_quality: "low".
2. Never invent ingredients.
3. Never invent nutrition values.
4. If you cannot identify the product name, return "UNREADABLE_SPECIMEN".`;

  // ══════════════════════════════════════════════════════════════
  // PART 6 — OUTPUT INSTRUCTION
  // ══════════════════════════════════════════════════════════════
  const outputInstruction = `Return ONLY the JSON object in this exact schema. No markdown. No explanation. No text before the opening brace. No text after the closing brace. Start your response with { and end with }.

{
  "extraction_quality": "high|low",
  "needs_research": boolean,
  "living_being": false,
  "category": "Food|Beverage|Supplement",
  "product_name": "exact product name read from the label",
  "brand": "brand name read from the label",
  "ingredients": "full comma-separated ingredient list exactly as printed on the label",
  "nutrition": {
    "calories": number or null,
    "fat": number or null,
    "sugar": number or null,
    "salt": number or null,
    "protein": number or null,
    "carbohydrates": number or null
  },
  "marketing_claims": ["claim 1 from label", "claim 2 from label"]
}`;

  // Assemble the complete prompt
  const unifiedPrompt = `${ocrInstruction}

${nonFoodCheck}

${extractionInstructions}

${qualityCheck}

${antiHallucination}

${outputInstruction}`;

  console.log('[Vision Service] Initiating OCR-First Clinical Discovery...');

  try {
    const result = await runNvidiaAgent(
      "Read all text from this food product label image and extract the product name, ingredients, nutrition facts, and marketing claims.",
      unifiedPrompt,
      {
        modelType: 'vision',
        image: imageRef,
        ensureJSON: true,
        maxTokens: 1200,
        retries: 1
      }
    );

    const elapsed = Date.now() - startTime;
    console.log(`[Vision Service] Discovery complete in ${elapsed}ms`);
    console.log('[Vision Service] Extracted product_name:', result?.product_name);
    console.log('[Vision Service] Extracted ingredients length:', result?.ingredients?.length || 0);
    console.log('[Vision Service] Extracted claims:', result?.marketing_claims);

    if (result?.living_being || result?.category === 'Non-Food') {
      return {
        living_being: true,
        category: 'Non-Food',
        structured: { product_name: result?.product_name || "Non-Food Specimen", ingredients: "N/A" },
        image_url: isUrl ? imageInput : null
      };
    }

    return {
      living_being: false,
      category: result?.category || 'Food',
      needs_research: result?.needs_research || false,
      raw: result?.ingredients || "",
      structured: result || {},
      image_url: isUrl ? imageInput : null
    };
  } catch (err) {
    console.error(`[Vision Service] FAILED after ${Date.now() - startTime}ms:`, err.message);
    return {
      living_being: false,
      structured: { product_name: "Extraction Failed", ingredients: "" },
      image_url: isUrl ? imageInput : null,
      needs_research: true,
      error: err.message
    };
  }
}

module.exports = { processProductImage };

const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * HIGH-SPEED CLINICAL VISION PIPELINE (V5.2 — 15s Hardened)
 * Optimized for rapid specimen identification and early category exit.
 */
async function processProductImage(imageInput) {
  const startTime = Date.now();
  const isUrl = typeof imageInput === 'string' && imageInput.startsWith('http');
  const imageRef = isUrl ? imageInput : imageInput;

  const unifiedPrompt = `[MODE: CLINICAL_VISION_V5.2 — SPEED_OPTIMIZED]
  Objective: Deconstruct this specimen with extreme precision for high-speed clinical analysis.
  
  1. CATEGORY GUARD: 
     - If this is NOT a retail food, beverage, or supplement product (human face, electronic, clothing, pet, etc.), set "category": "Non-Food" and "living_being": true.
     - If it IS consumable, set "category": "Food" and "living_being": false.
  
  2. OCR_CORE: Extract Brand, Name, Ingredients, and Nutrition (Energy kcal, Fat, Sugars, Salt, Protein, Carbs). 
     - PER 100g ONLY. Convert kJ to kcal (/4.184) and Sodium to Salt (mg/1000 * 2.5) if needed.
  
  3. MAPPING:
  {
    "living_being": boolean,
    "product_name": "Full name + brand",
    "brand": "Brand name",
    "ingredients": "Comma separated ingredients",
    "nutrition": { "calories": number|null, "fat": number|null, "sugar": number|null, "salt": number|null, "protein": number|null, "carbohydrates": number|null },
    "marketing_claims": ["list"],
    "category": "Food|Beverage|Supplement|Non-Food"
  }
  
  Note: Prioritize speed. If data is obscured, use standard values based on product category.`;

  console.log('[Vision Service] Initiating 15s High-Speed Discovery...');
  
  try {
    const result = await runNvidiaAgent(
      "Classify and extract clinical specimen data.", 
      unifiedPrompt, 
      {
        modelType: 'vision',
        image: imageRef,
        ensureJSON: true,
        maxTokens: 1200, // Reduced from 3000 to save time
        retries: 1      // Reduced from 2 to save time — if it fails once, we fallback to research
      }
    );

    const elapsed = Date.now() - startTime;
    console.log(`[Vision Service] Discovery complete in ${elapsed}ms`);

    if (result?.living_being || result?.category === 'Non-Food') {
      return {
        living_being: true,
        category: 'Non-Food',
        structured: { product_name: "Non-Food Specimen", ingredients: "N/A" },
        image_url: isUrl ? imageInput : null
      };
    }

    return { 
      living_being: false,
      category: result?.category || 'Food',
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
      error: err.message
    };
  }
}

module.exports = { processProductImage };

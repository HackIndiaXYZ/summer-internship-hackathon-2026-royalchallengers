const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * HIGH-SPEED CLINICAL VISION PIPELINE (V5.0 - Production Fix)
 * Stage 1: Consolidated OCR + Clinical Structuring + Safety Guard.
 * 
 * CRITICAL FIX: This function now correctly handles BOTH:
 *   - Cloudinary URLs (when called from visionController image pipeline)
 *   - Base64 strings (when called from legacy extractImageText)
 * 
 * Cloudinary upload is handled by the CALLER (visionController), NOT here.
 * This prevents the double-upload bug that caused pipeline stalls.
 */
async function processProductImage(imageInput) {
  const startTime = Date.now();
  
  // Determine if input is a URL or base64
  const isUrl = typeof imageInput === 'string' && imageInput.startsWith('http');
  
  console.log(`[Vision Service] Input type: ${isUrl ? 'URL' : 'base64'} | Length: ${imageInput?.length || 0}`);

  const unifiedPrompt = `[MODE: CLINICAL_VISION_V5.0]
  Deconstruct this specimen image with extreme scientific and medical precision.
  
  1. SAFETY GUARD (LIVING_BEING): If this is a human, animal, or living organism (not a retail product/botanical specimen), set "living_being": true.
  2. OCR_EXTRACTION: Extract ALL content, including:
     - Full Brand and Product Name
     - Full Ingredient list (including additives and E-numbers)
     - Nutrition Facts: Extract Energy (kcal), Total Fat (g), Total Sugars (g), Salt/Sodium (g), Protein (g), Total Carbohydrates (g).
     - CONVERSION RULES:
       - Always use values per 100g. If only 'per serving' is shown, calculate per 100g based on serving size.
       - Energy: If in kJ, convert: kcal = kJ / 4.184.
       - Salt: If only Sodium (mg) is given, convert: Salt (g) = (Sodium / 1000) * 2.5.
  3. CLINICAL_MAPPING: Map to the following schema:
  
  {
    "living_being": boolean,
    "product_name": "Full product name including brand",
    "brand": "Brand name if visible",
    "ingredients": "Comma separated string of ALL ingredients",
    "nutrition": {
      "calories": number | null,
      "fat": number | null,
      "sugar": number | null,
      "salt": number | null,
      "protein": number | null,
      "carbohydrates": number | null
    },
    "marketing_claims": ["list of claims visible on package"],
    "category": "Food | Beverage | Supplement | Botanical | Non-Food",
    "allergens": ["list", "of", "allergens"],
    "health_flags": "Immediate clinical red flags"
  }
  
  Note: If any nutrition value is not visible or identifiable, set to null. Never guess.`;

  console.log('[Vision Service] Initiating Clinical Scan (90B Vision)...');
  
  try {
    // Build the image reference for the NVIDIA API
    // The NVIDIA vision model accepts both URLs and base64 data URIs
    const imageRef = isUrl ? imageInput : imageInput;

    const result = await runNvidiaAgent(
      "Deconstruct this clinical specimen into structured data with a living-being check.", 
      unifiedPrompt, 
      {
        modelType: 'vision',
        image: imageRef,
        ensureJSON: true,
        maxTokens: 3000,
        retries: 2  // Reduced retries for speed — 2 retries max instead of 3
      }
    );

    const elapsed = Date.now() - startTime;
    console.log(`[Vision Service] Vision complete in ${elapsed}ms`);

    // If we detect a living being, flag it immediately for the orchestrator to abort
    if (result?.living_being) {
      console.warn('[Vision Service] LBS_ALERT: Living being detected. Aborting pipeline.');
      return {
        living_being: true,
        raw: "LIVING_BEING_DETECTED",
        structured: { product_name: "N/A - Non-Product Specimen", ingredients: "N/A" },
        image_url: isUrl ? imageInput : null
      };
    }

    return { 
      living_being: false,
      raw: result?.ingredients || "Extraction incomplete",
      structured: result || {},
      image_url: isUrl ? imageInput : null
    };
  } catch (err) {
    console.error(`[Vision Service] CRITICAL FAILURE after ${Date.now() - startTime}ms:`, err.message);
    // Return a structured error instead of throwing — prevents pipeline stall
    return {
      living_being: false,
      raw: "Vision extraction failed",
      structured: {
        product_name: "Unknown Product",
        brand: null,
        ingredients: "",
        nutrition: null,
        marketing_claims: [],
        category: "Unknown"
      },
      image_url: isUrl ? imageInput : null,
      error: err.message
    };
  }
}

module.exports = { processProductImage };

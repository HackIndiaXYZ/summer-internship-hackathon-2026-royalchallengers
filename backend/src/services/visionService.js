const { runNvidiaAgent } = require('../lib/nvidia');
const cloudinary = require('../lib/cloudinary');

/**
 * HIGH-SPEED CLINICAL VISION PIPELINE (V4.6 - Production Ready)
 * Stage 1: Consolidated OCR + Clinical Structuring + Safety Guard + Image Persistence.
 * Optimized for <5s execution with 90B Vision model.
 */
async function processProductImage(base64Image) {
  // 1. ASYNC IMAGE PERSISTENCE (Cloudinary)
  const uploadPromise = cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Image}`, {
    folder: 'medo_veda_scans',
  }).catch(err => {
    console.error('[Vision Service] Cloudinary Upload Failed:', err.message);
    return null;
  });

  const unifiedPrompt = `[MODE: CLINICAL_VISION_V4.6]
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
    "ingredients": "Comma separated string of ALL ingredients",
    "nutrition": {
      "calories": number | null,
      "fat": number | null,
      "sugar": number | null,
      "salt": number | null,
      "protein": number | null,
      "carbohydrates": number | null
    },
    "category": "Food | Beverage | Supplement | Botanical | Non-Food",
    "allergens": ["list", "of", "allergens"],
    "health_flags": "Immediate clinical red flags"
  }
  
  Note: If any nutrition value is not visible or identifiable, set to null. Never guess.`;

  console.log('[Vision Service] Initiating Consolidated Clinical Scan (90B Vision)...');
  
  // RUN VISION AGENT
  const visionPromise = runNvidiaAgent(
    "Deconstruct this clinical specimen into structured data with a living-being check.", 
    unifiedPrompt, 
    {
      modelType: 'vision',
      image: base64Image,
      ensureJSON: true,
      maxTokens: 3500
    }
  );

  // Await both upload and vision analysis
  const [result, cloudinaryRes] = await Promise.all([visionPromise, uploadPromise]);

  // If we detect a living being, we flag it immediately for the orchestrator to abort
  if (result?.living_being) {
    console.warn('[Vision Service] LBS_ALERT: Living being detected in scan. Aborting pipeline.');
    return {
      living_being: true,
      raw: "LIVING_BEING_DETECTED",
      structured: { product_name: "N/A - Non-Product Specimen", ingredients: "N/A" },
      image_url: cloudinaryRes?.secure_url || null
    };
  }

  return { 
    living_being: false,
    raw: result?.ingredients || "Extraction incomplete",
    structured: result || {},
    image_url: cloudinaryRes?.secure_url || null 
  };
}

module.exports = { processProductImage };

const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * High-Accuracy Two-Stage Vision Pipeline
 * Stage 1: Raw transcription with Llama 3.2 90B Vision
 * Stage 2: Logical structuring with Llama 3.1 70B Clinical
 */
async function processProductImage(base64Image) {
  // STAGE 1: High-Accuracy Raw OCR
  const rawOcrPrompt = `You are an Expert OCR Machine v4.0 (Zero-Loss Transcription Mode).
  Your mission is to transcribe EVERY character from the image with 100% fidelity.
  
  ---
  ## CORE PRIORITIES
  1. **Ingredients Block**: Usually small text, often listed after "Ingredients:" or "Contains:". Extract every single word.
  2. **Nutrition Facts**: Look for tabular data or "Per 100g/serving" sections.
  3. **Product Branding**: Extract the main brand and specific product name.
  
  ---
  ## TECHNICAL RULES
  * **No Summarization**: Do not omit items (e.g., if it says "Sugar, Salt (1%), Water", do not just write "Sugar").
  * **Handle Varied Layouts**: Transcribe text even if it is vertically oriented, curved, or in very small font.
  * **No JSON**: Just return clean, raw text preserving line breaks.
  * **No Conversation**: Do not explain your output.`;

  console.log('[Vision Service] STAGE 1: Raw OCR (90B Vision)...');
  
  const rawText = await runNvidiaAgent(
    "Perform full transcription of the image.", 
    rawOcrPrompt, 
    {
      modelType: 'vision',
      image: base64Image,
      ensureJSON: false,
      maxTokens: 2500,
      retries: 2
    }
  );

  if (!rawText || rawText.startsWith('Error:')) {
    throw new Error(rawText || 'Raw OCR failed');
  }

  // STAGE 2: Clinical Structuring
  console.log('[Vision Service] STAGE 2: Structuring Data (70B Clinical)...');
  
  const structurePrompt = `You are a Clinical Data Intake Specialist. 
  Your goal is to map RAW OCR DATA into a high-precision Product Schema.
  
  ---
  ## DATA SOURCE (RAW OCR):
  """
  ${rawText}
  """
  
  ---
  ## EXTRACTION PROTOCOL: "Deep Ingredient Mining"
  1. **Identify Ingredients**: Even if the word "Ingredients" is missing, look for lists of food items (e.g., "Wheat, Sugar, Soy...").
  2. **Format**: Return "ingredients" as a clean comma-separated string.
  3. **Nutritional Estimation**: If numeric values are missing or garbled, use your clinical knowledge to ESTIMATE them based on the product type (e.g., if it's a cookie, estimate sugar/fat per 100g). NEVER leave null.
  
  ---
  ## FEW-SHOT EXAMPLE:
  Input: "Fresh Milk. 3.5% fat. Contains: Milk, Vitamin D."
  Output: {
    "brand": "Generic",
    "name": "Fresh Milk",
    "ingredients": "Milk, Vitamin D",
    "nutrition": { "fat": 3.5, "calories": 60, "protein": 3.2 },
    "claims": ["3.5% fat"]
  }
  
  ---
  ## FINAL RULES:
  * Output ONLY raw JSON.
  * No markdown blocks.
  * Standardize units to metric (g, mg, kcal).`;

  const structuredResult = await runNvidiaAgent(
    "Structure the provided OCR text into the product schema.",
    structurePrompt,
    {
      modelType: 'clinical',
      ensureJSON: true,
      maxTokens: 2000
    }
  );

  const parsed = JSON.parse(structuredResult);
  return { raw: rawText, structured: parsed };
}

module.exports = { processProductImage };

const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * High-Accuracy Two-Stage Vision Pipeline
 * Stage 1: Raw transcription with Llama 3.2 90B Vision
 * Stage 2: Logical structuring with Llama 3.1 70B Clinical
 */
async function processProductImage(base64Image) {
  // STAGE 1: High-Accuracy Raw OCR
  const rawOcrPrompt = `You are a high-accuracy OCR system.
  Your ONLY task is to transcribe ALL visible text from the image exactly as written.
  
  ---
  ## RULES
  * Do NOT summarize
  * Do NOT structure into JSON
  * Do NOT interpret meaning
  * Do NOT clean aggressively
  * Preserve original formatting as much as possible
  
  ---
  ## OUTPUT FORMAT
  Return plain text only.
  
  ---
  ## EXTRACTION REQUIREMENTS
  * Capture ingredients section fully
  * Capture nutrition table text
  * Capture all claims and labels
  * Include line breaks where visible
  
  ---
  ## FINAL INSTRUCTION
  You are NOT an AI assistant.
  You are an OCR engine.
  Accuracy of raw text is the only priority.`;

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
  
  const structurePrompt = `You are a clinical data scientist.
  Your task is to take the RAW OCR TEXT from a food product and map it into a clean, structured JSON object.
  
  RAW OCR TEXT:
  """
  ${rawText}
  """
  
  RULES:
  1. Extract "brand", "name", "ingredients" (comma-separated list), "nutrition" (object), and "claims".
  2. If nutritional values are missing, you MUST ESTIMATE them based on the product type (per 100g). NEVER return empty or placeholder values in the JSON.
  3. Ensure ingredients are NOT summarized. List every single one.
  4. Fix obvious OCR typos (e.g., "5ugar" -> "Sugar").`;

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

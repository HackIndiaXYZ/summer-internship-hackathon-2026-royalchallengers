const { runNvidiaAgent } = require('./src/lib/nvidia');

async function testStructuring(rawText) {
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

  try {
    const result = await runNvidiaAgent(
      "Structure this data.",
      structurePrompt,
      { modelType: 'clinical', ensureJSON: true }
    );
    console.log('Result:', JSON.parse(result));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

const messyData = `
BEST BEFORE 12/25
CORN SYRUP, SUGAR, COCOA BUTTER, 
HYDROGENATED VEGETABLE OIL...
LOT: 99x-12
NET WT 200G
MADE IN USA
`;

console.log('Testing with messy data (No "Ingredients" header)...');
testStructuring(messyData);

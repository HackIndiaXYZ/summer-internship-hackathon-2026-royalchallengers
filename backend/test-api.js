require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const KEY = process.env.GOOGLE_API_KEY;
console.log('API Key present:', !!KEY, '| First 10 chars:', KEY?.slice(0, 10));

const genAI = new GoogleGenerativeAI(KEY);

async function testAPI() {
  console.log('\n--- TEST 1: Basic model call (no search) ---');
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Say HELLO in exactly 5 words.");
    const text = result.response.text();
    console.log('SUCCESS. Response:', text.trim().slice(0, 100));
  } catch (err) {
    console.error('FAILED:', err.message);
    console.error('Status:', err.status);
  }

  console.log('\n--- TEST 2: JSON output test ---');
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(`
      Analyze Maggi 2-Minute Noodles for a diabetic user.
      Return ONLY JSON: { "product": "...", "verdict": "safe|limit|avoid", "reason": "..." }
    `);
    const text = result.response.text();
    console.log('SUCCESS. Raw response:', text.trim().slice(0, 300));
  } catch (err) {
    console.error('FAILED:', err.message);
    console.error('Status:', err.status);
  }

  console.log('\n--- TEST 3: Search grounding test ---');
  try {
    const modelWithSearch = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ googleSearchRetrieval: {} }]
    });
    const result = await modelWithSearch.generateContent("What is the current WHO recommended daily salt limit? Return ONLY JSON: { \"limit\": \"...\", \"source\": \"WHO\" }");
    const text = result.response.text();
    console.log('SUCCESS. Response:', text.trim().slice(0, 300));
  } catch (err) {
    console.error('FAILED:', err.message);
    console.error('Status:', err.status);
    if (err.message?.includes('403') || err.message?.includes('permission')) {
      console.log('>> KEY ISSUE: API key may not have Search Grounding permission');
    }
    if (err.message?.includes('quota') || err.message?.includes('429')) {
      console.log('>> QUOTA ISSUE: API quota exceeded - need new key or wait');
    }
  }

  console.log('\n--- TEST 4: Full pipeline mini-test ---');
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(`
      A diabetic user scanned "Maggi 2-Minute Noodles".
      Analyze ALL of this:
      1. Identify the real ingredients
      2. Classify each ingredient risk (high/medium/low) for a DIABETIC user  
      3. Give a verdict: safe, limit, or avoid
      4. Give one specific personalized recommendation for a diabetic
      
      Return ONLY valid JSON:
      {
        "product": { "name": "...", "brand": "..." },
        "ingredients": [{ "name": "...", "risk": "high|medium|low", "reason": "..." }],
        "verdict": "safe|limit|avoid",
        "verdict_score": 1-10,
        "personalized_advice": "..."
      }
    `);
    const text = result.response.text();
    console.log('SUCCESS. Response preview:');
    console.log(text.trim().slice(0, 500));
  } catch (err) {
    console.error('FAILED:', err.message);
  }
}

testAPI().then(() => {
  console.log('\n--- DIAGNOSTIC COMPLETE ---');
  process.exit(0);
});

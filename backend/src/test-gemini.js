const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function test(modelName) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  console.log(`Testing model: ${modelName} with key: ${process.env.GOOGLE_API_KEY.substring(0, 5)}...`);
  
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello.");
    const response = await result.response;
    console.log(`Success [${modelName}]:`, response.text());
  } catch (err) {
    console.error(`Failed [${modelName}]:`, err.status, err.message);
  }
}

async function runAll() {
  await test("gemini-pro");
  await test("gemini-1.5-pro-latest");
  await test("gemini-1.5-flash-latest");
}

runAll();

const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

async function testVertex(modelName) {
  const vertex_ai = new VertexAI({ 
    project: process.env.GOOGLE_CLOUD_PROJECT_ID || 'medo-veda', 
    location: 'asia-south1' 
  });

  console.log(`Testing model: ${modelName}...`);
  try {
    const generativeModel = vertex_ai.getGenerativeModel({ model: modelName });
    const result = await generativeModel.generateContent("Hello.");
    const response = await result.response;
    console.log(`Success [${modelName}]:`, response.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error(`Failed [${modelName}]:`, err.status, err.message);
  }
}

async function runTests() {
  await testVertex("gemini-2.5-flash");
  await testVertex("gemini-1.5-flash-002");
}

runTests();

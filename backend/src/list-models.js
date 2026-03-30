const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listAllModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  console.log(`Listing models for key: ${process.env.GOOGLE_API_KEY.substring(0, 5)}...`);
  
  try {
    // Note: The SDK might not have a direct listModels, we might need to use fetch or discovery
    // But let's try a very basic fetch to the endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
    const data = await response.json();
    console.log("Available Models:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("List Models Failed:", err.message);
  }
}

listAllModels();

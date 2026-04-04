require('dotenv').config({ path: './.env' });
const axios = require('axios');
const cloudinary = require('cloudinary').v2;

async function checkNvidiaKeys() {
  const keys = [
    process.env.NVIDIA_API_KEY,
    process.env.NVIDIA_API_KEY_2,
    process.env.NVIDIA_API_KEY_3
  ];

  console.log('--- Checking NVIDIA API Keys ---');
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!key) {
      console.log(`Key ${i + 1}: MISSING`);
      continue;
    }
    try {
      const response = await axios.post(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        {
          model: 'meta/llama-3.1-8b-instruct',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`Key ${i + 1}: WORKING (Status: ${response.status})`);
    } catch (error) {
      console.log(`Key ${i + 1}: FAILED (${error.response?.data?.error?.message || error.message})`);
    }
  }
}

async function checkCloudinary() {
  console.log('\n--- Checking Cloudinary ---');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary: WORKING');
  } catch (error) {
    console.log(`Cloudinary: FAILED (${error.message})`);
  }
}

async function run() {
  await checkNvidiaKeys();
  await checkCloudinary();
}

run();

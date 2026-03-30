const https = require('https');
require('dotenv').config();

const API_KEY = process.env.NVIDIA_API_KEY || 'nvapi-_ztKMpNfVKQfk7DyWLWn7LjmZKXi443kyW_x7QG9GcYw2H5a';

const payload = JSON.stringify({
  model: "meta/llama-3.3-70b-instruct",
  messages: [
    { role: "user", content: "Tell me about Salt in exactly 3 words." }
  ],
  temperature: 0.2,
  max_tokens: 100
});

const options = {
  hostname: 'integrate.api.nvidia.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('Testing NVIDIA API with meta/llama-3.3-70b-instruct...');
const start = Date.now();

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const end = Date.now();
    console.log('Status:', res.statusCode);
    console.log('Total Time:', (end - start) / 1000, 'seconds');
    if (res.statusCode === 200) {
      const json = JSON.parse(data);
      console.log('SUCCESS! Response:', json.choices?.[0]?.message?.content);
    } else {
      console.log('FAILED. Body:', data);
    }
  });
});

req.on('error', e => {
  console.error('Request error:', e.message);
});

req.write(payload);
req.end();

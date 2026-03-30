const https = require('https');

const API_KEY = 'nvapi-_ztKMpNfVKQfk7DyWLWn7LjmZKXi443kyW_x7QG9GcYw2H5a';

const payload = JSON.stringify({
  model: "google/gemma-3n-e4b-it",
  messages: [
    { role: "user", content: "Return ONLY valid JSON: {\"status\": \"working\", \"model\": \"gemma-3n\"}" }
  ],
  temperature: 0.2,
  max_tokens: 200
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

console.log('Testing NVIDIA API with google/gemma-3n-e4b-it...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 200) {
      const json = JSON.parse(data);
      const content = json.choices?.[0]?.message?.content;
      console.log('SUCCESS! Response:', content);
      console.log('\n✅ NVIDIA API key is WORKING. Safe to switch pipeline.');
    } else {
      console.log('FAILED. Body:', data.slice(0, 500));
      console.log('\n❌ NVIDIA API key is NOT working.');
    }
  });
});

req.on('error', e => {
  console.error('Request error:', e.message);
});

req.write(payload);
req.end();

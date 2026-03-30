const https = require('https');

const API_KEY = 'nvapi-_ztKMpNfVKQfk7DyWLWn7LjmZKXi443kyW_x7QG9GcYw2H5a';

// Test multiple common NVIDIA models to find which one works
const models = [
  "meta/llama-3.1-8b-instruct",
  "meta/llama-3.3-70b-instruct",
  "mistralai/mistral-7b-instruct-v0.3",
  "microsoft/phi-3-mini-128k-instruct",
  "google/gemma-3-27b-it",
  "google/gemma-3-12b-it",
  "google/gemma-3-4b-it",
  "nvidia/llama-3.1-nemotron-nano-8b-v1"
];

async function testModel(model) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      model,
      messages: [{ role: "user", content: "Say: WORKING" }],
      max_tokens: 20
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

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          resolve({ model, status: '✅ WORKS', response: json.choices?.[0]?.message?.content?.slice(0, 50) });
        } else {
          resolve({ model, status: `❌ ${res.statusCode}` });
        }
      });
    });
    req.on('error', e => resolve({ model, status: `❌ ERROR: ${e.message}` }));
    req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('Testing NVIDIA API key across common models...\n');
  for (const model of models) {
    const result = await testModel(model);
    console.log(`${result.status} | ${result.model}${result.response ? ' → ' + result.response : ''}`);
  }
  console.log('\nDone. Use a ✅ model above.');
})();

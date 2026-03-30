const https = require('https');

const API_KEY = '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';

const models = [
  "meta/llama-3.1-8b-instruct",
  "meta/llama-3.3-70b-instruct",
  "mistralai/mistral-7b-instruct-v0.3",
  "google/gemma-3-27b-it",
  "google/gemma-3-12b-it",
  "google/gemma-3-4b-it",
  "nvidia/llama-3.1-nemotron-nano-8b-v1",
  "microsoft/phi-3-mini-128k-instruct"
];

async function testModel(model) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      model,
      messages: [{ role: "user", content: "Say exactly: WORKING" }],
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
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({ model, status: '✅ WORKS', response: json.choices?.[0]?.message?.content?.trim() });
          } catch {
            resolve({ model, status: '✅ 200 but parse error' });
          }
        } else {
          resolve({ model, status: `❌ ${res.statusCode}` });
        }
      });
    });
    req.on('error', e => resolve({ model, status: `❌ ERR: ${e.message}` }));
    req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('Testing new NVIDIA key...\n');
  for (const model of models) {
    const r = await testModel(model);
    console.log(`${r.status} | ${r.model}${r.response ? ' → "' + r.response + '"' : ''}`);
  }
})();

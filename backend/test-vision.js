const https = require('https');

const API_KEY = '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';

const models = [
  "meta/llama-3.2-11b-vision-instruct",
  "meta/llama-3.2-90b-vision-instruct",
  "nvidia/llama-3.2-nv-vision-instruct"
];

async function testModel(model) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      model,
      messages: [{ role: "user", content: "WORKING" }],
      max_tokens: 10
    });
    const options = {
      hostname: 'integrate.api.nvidia.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` }
    };
    const req = https.request(options, (res) => resolve(res.statusCode));
    req.on('error', () => resolve('error'));
    req.write(payload);
    req.end();
  });
}

(async () => {
  for (const model of models) {
    const status = await testModel(model);
    console.log(`${model}: ${status}`);
  }
})();

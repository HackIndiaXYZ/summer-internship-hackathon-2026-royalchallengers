const https = require('https');
require('dotenv').config();

const API_KEY = process.env.NVIDIA_API_KEY || 'nvapi-_ztKMpNfVKQfk7DyWLWn7LjmZKXi443kyW_x7QG9GcYw2H5a';

const payload = JSON.stringify({
  model: "meta/llama-3.1-8b-instruct",
  messages: [{ role: "user", content: "Hi" }],
  max_tokens: 10
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

async function test8b() {
  console.log('Testing 8B speed/quota...');
  const start = Date.now();
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Time:', (Date.now() - start), 'ms');
      if (res.statusCode !== 200) console.log('Error:', data);
    });
  });
  req.write(payload);
  req.end();
}

test8b();
test8b();
test8b();

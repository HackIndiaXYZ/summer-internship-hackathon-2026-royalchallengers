const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testImageScan() {
  try {
    const filePath = path.join(__dirname, '..', 'frontend', 'public', 'images', 'botanical.png');
    if (!fs.existsSync(filePath)) {
      console.log("No test image found at", filePath);
      return;
    }
    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));
    form.append('userId', 'TEST_BOT');

    console.log('Sending POST to /api/analyze...');
    const start = Date.now();
    const res = await axios.post('http://localhost:3001/api/analyze', form, {
      headers: form.getHeaders(),
      timeout: 60000
    });
    console.log('Initial Response in', Date.now() - start, 'ms:', res.data);

    if (res.data.success) {
      const { scanId } = res.data;
      
      const poll = setInterval(async () => {
        try {
          const statusRes = await axios.get(`http://localhost:3001/api/scan/status/${scanId}`);
          console.log('[POLL]', statusRes.data.step, statusRes.data.label);
          if (statusRes.data.complete) {
            clearInterval(poll);
            console.log('Final Result Data fetched in', Date.now() - start, 'ms');
            if (statusRes.data.error) {
              console.log('ERROR:', statusRes.data.error);
            } else {
              const resultRes = await axios.get(`http://localhost:3001/api/scan/result/${scanId}`);
              console.log('SUCCESS! Extracted productName:', resultRes.data.data.productName);
              if (resultRes.data?.data?.analysis?.ingredients) {
                 console.log('Extracted ingredients:', resultRes.data.data.analysis.ingredients.slice(0, 2), '...');
              }
            }
          }
        } catch(e) {
          console.error("Polling error:", e.message);
        }
      }, 2000);
    }

  } catch(e) {
    console.error('Test error:', e.message);
    if(e.response) console.error(e.response.data);
  }
}

testImageScan();

const axios = require('axios');

async function diagnostic() {
  console.log('--- STARTING BACKEND DIAGNOSTIC ---');
  const API_URL = 'http://127.0.0.1:3001';
  
  try {
    console.log(`[1] Testing Health Endpoint (${API_URL}/health)...`);
    const health = await axios.get(`${API_URL}/health`);
    console.log('Success:', health.data);
  } catch (err) {
    console.error('Health Check Failed:', err.message);
  }

  try {
    console.log(`[2] Testing Scan Endpoint (${API_URL}/api/scans)...`);
    const payload = {
      type: 'text',
      content: 'PRODUCT_NAME: Test Snack\nINGREDIENTS_LIST: Sugar, Salt, Water',
      userId: 'GUEST'
    };
    const start = Date.now();
    const res = await axios.post(`${API_URL}/api/scans`, payload);
    console.log(`Success (${Date.now() - start}ms):`, res.data.success ? 'OK' : 'FAIL');
    if (res.data.scanId) console.log('Scan ID:', res.data.scanId);
  } catch (err) {
    console.error('Scan Endpoint Failed:', err.response?.data || err.message);
  }
  
  console.log('--- DIAGNOSTIC COMPLETE ---');
}

diagnostic();

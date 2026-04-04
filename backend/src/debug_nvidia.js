const { runNvidiaAgent } = require('./lib/nvidia');
require('dotenv').config();

async function debugCall() {
  console.log('Sending single 8B request via runNvidiaAgent...');
  try {
    const start = Date.now();
    const result = await runNvidiaAgent('Say "Working"', 'You are a help assistant', { modelType: 'agility', maxTokens: 100 });
    console.log(`Success in ${Date.now() - start}ms:`, result);
  } catch (error) {
    console.error('Call failed:', error.message);
  }
}

debugCall();

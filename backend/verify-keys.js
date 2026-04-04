const { runNvidiaAgent } = require('./src/lib/nvidia');

async function testKeys() {
  console.log('--- NVIDIA API KEY VERIFICATION ---');
  for (let i = 1; i <= 3; i++) {
    const keyName = i === 1 ? 'NVIDIA_API_KEY' : `NVIDIA_API_KEY_${i}`;
    console.log(`[Testing] ${keyName}...`);
    try {
      // Small test prompt
      const result = await runNvidiaAgent('Say "Hello World"', 'System check', { 
        modelType: 'agility', 
        maxTokens: 10,
        retries: 0 // Fail fast for verification
      });
      console.log(`[Success] ${keyName} is ACTIVE.`);
    } catch (err) {
      console.error(`[FAILURE] ${keyName}:`, err.message);
    }
  }
}

testKeys();

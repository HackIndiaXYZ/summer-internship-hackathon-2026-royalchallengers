const { runNvidiaAgent } = require('./lib/nvidia');

async function test413() {
  console.log('Testing 413 Payload Error handling...');
  
  // Create a very large dummy "image" string that might trigger 413 if sent to real API,
  // but we want to test the LOGIC in nvidia.js.
  // Actually, I'll mock callNvidiaAPI for this test if I want to be surgical.
  
  // Let's just run a real small vision test first to see if vision protocol works.
  try {
    const result = await runNvidiaAgent(
      "Extract ingredients", 
      "You are a scanner.", 
      { modelType: 'vision', image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' }
    );
    console.log('Vision Result:', result);
  } catch (e) {
    console.error('Vision Error:', e);
  }
}

test413();

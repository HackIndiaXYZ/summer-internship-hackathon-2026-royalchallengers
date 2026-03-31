const { runNvidiaAgent } = require('./src/lib/nvidia');
require('dotenv').config();

async function testImageProtocol() {
  const dummyImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='; // Tiny red dot
  
  console.log('Testing Image Protocol with Vision Model...');
  try {
    const result = await runNvidiaAgent(
      'Extract the product name from this image.',
      'You are a Vision AI.',
      { modelType: 'vision', image: dummyImage, maxTokens: 200 }
    );
    console.log('--- RESPONSE ---');
    console.log(result);
  } catch (err) {
    console.error('Image Protocol Error:', err);
  }
}

testImageProtocol();

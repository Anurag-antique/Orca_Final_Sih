const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[TEST PHASE 13] Running Multilingual AI tests against ${baseUrl}`);

  try {
    // 1. Test Hindi Query
    console.log('1. Testing Hindi Query: "क्या कल सुबह मुंबई के पास मछली पकड़ने जाना सुरक्षित है?"...');
    const hiRes = await fetch(`${baseUrl}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'क्या कल सुबह मुंबई के पास मछली पकड़ने जाना सुरक्षित है?',
        language: 'hi'
      })
    });
    const hiData = await hiRes.json();
    console.log('   Status:', hiRes.status);
    console.log('   Detected Language:', hiData.aiResponse?.language);
    console.log('   Intent:', hiData.aiResponse?.intent);
    console.log('   Response Snippet:', hiData.aiResponse?.text?.substring(0, 70));

    if (hiRes.status !== 200 || hiData.aiResponse?.language !== 'hi' || !hiData.aiResponse?.text?.includes('सुरक्षा')) {
      throw new Error('Hindi query failed');
    }

    // 2. Test Marathi Query
    console.log('2. Testing Marathi Query: "उद्या सकाळी मुंबईजवळ मासेमारी करणे सुरक्षित आहे का?"...');
    const mrRes = await fetch(`${baseUrl}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'उद्या सकाळी मुंबईजवळ मासेमारी करणे सुरक्षित आहे का?',
        language: 'mr'
      })
    });
    const mrData = await mrRes.json();
    console.log('   Status:', mrRes.status);
    console.log('   Detected Language:', mrData.aiResponse?.language);
    console.log('   Response Snippet:', mrData.aiResponse?.text?.substring(0, 70));

    if (mrRes.status !== 200 || mrData.aiResponse?.language !== 'mr' || !mrData.aiResponse?.text?.includes('सागरी')) {
      throw new Error('Marathi query failed');
    }

    console.log('\n========================================');
    console.log('>>> ALL PHASE 13 MULTILINGUAL TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Phase 13 test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

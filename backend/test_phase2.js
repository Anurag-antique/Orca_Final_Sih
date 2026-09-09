const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[TEST PHASE 2] Running backend tests against ${baseUrl}`);

  try {
    // 1. Test Login with Demo User
    console.log('1. Testing Login with default demo user...');
    const demoLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@orca.marine', password: 'Password123!' })
    });
    const demoLoginData = await demoLoginRes.json();
    console.log('   Demo Login Status:', demoLoginRes.status, 'Token exists:', !!demoLoginData.token);
    if (demoLoginRes.status !== 200 || !demoLoginData.token) throw new Error('Demo login failed');

    const demoToken = demoLoginData.token;

    // 2. Test Get Profile with JWT
    console.log('2. Testing Get Profile with JWT token...');
    const profileRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${demoToken}` }
    });
    const profileData = await profileRes.json();
    console.log('   Profile Status:', profileRes.status, 'User Name:', profileData.user?.name);
    if (profileRes.status !== 200 || profileData.user?.email !== 'demo@orca.marine') throw new Error('Profile fetch failed');

    // 3. Test Register New User
    console.log('3. Testing Register new user...');
    const testEmail = `researcher_${Date.now()}@ocean.org`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Ananya Sharma',
        email: testEmail,
        password: 'SecurePassword123!',
        role: 'researcher',
        organization: 'National Marine Institute'
      })
    });
    const regData = await regRes.json();
    console.log('   Register Status:', regRes.status, 'New User ID:', regData.user?.id);
    if (regRes.status !== 201 || !regData.token) throw new Error('Registration failed');

    // 4. Test Dashboard Endpoint
    console.log('4. Testing GET /api/dashboard...');
    const dashRes = await fetch(`${baseUrl}/dashboard?sector=Mumbai%20Coast`);
    const dashData = await dashRes.json();
    console.log('   Dashboard Status:', dashRes.status, 'Risk Level:', dashData.data?.riskAssessment?.riskLevel);
    if (dashRes.status !== 200 || !dashData.data?.location) throw new Error('Dashboard summary failed');

    console.log('\n========================================');
    console.log('>>> ALL PHASE 2 BACKEND TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Phase 2 backend test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

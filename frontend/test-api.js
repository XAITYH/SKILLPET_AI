const http = require('http');

const endpoints = [
  { name: 'Home', path: '/' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Courses API', path: '/api/courses' },
  { name: 'User Progress API', path: '/api/user-progress?email=test@test.com' },
  { name: 'Current Course API', path: '/api/user-progress/current-course?email=test@test.com' },
  { name: 'Update User Stats API', path: '/api/auth/update-user-stats', method: 'POST' },
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint.path,
      method: endpoint.method || 'GET',
      headers: endpoint.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✓ ${endpoint.name}: ${res.statusCode} (${data.length} bytes)`);
        resolve({ status: res.statusCode, length: data.length });
      });
    });

    req.on('error', (e) => {
      console.log(`✗ ${endpoint.name}: Error - ${e.message}`);
      resolve({ status: 0, error: e.message });
    });

    if (endpoint.method === 'POST') {
      req.write(JSON.stringify({ email: 'test@test.com', gemsEarned: 1, isNewStreak: false, streakDays: 1 }));
    }

    req.end();
  });
}

async function runTests() {
  console.log('Testing API endpoints on http://localhost:3000\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\nAll tests complete!');
}

runTests();

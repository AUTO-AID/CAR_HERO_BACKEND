const axios = require('axios');

const http = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  validateStatus: () => true,
  timeout: 10000,
});

async function loginAdmin() {
  const res = await http.post('/admin/login', {
    email: 'admin@carhero.com',
    password: 'Admin@123',
  });
  const data = res.data.data || res.data;
  return data.accessToken;
}

async function measureEndpoint(token, url) {
  const start = Date.now();
  const res = await http.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const duration = Date.now() - start;
  console.log(`Endpoint: ${url.padEnd(50)} | Status: ${res.status} | Duration: ${duration}ms`);
}

async function main() {
  const token = await loginAdmin();
  if (!token) {
    console.error('Failed to retrieve token. Response body:', token);
    process.exit(1);
  }
  console.log('Login successful. Token acquired. Measuring response times...\n');

  const endpoints = [
    '/admin/dashboard/summary',
    '/admin/dashboard/providers-by-governorate',
    '/admin/dashboard/providers-by-service',
    '/admin/dashboard/providers-growth',
    '/admin/dashboard/top-cities',
    '/admin/stats',
    '/admin/wallet/stats',
    '/admin/stats/revenue',
    '/admin/stats/bookings',
    '/admin/stats/top-services',
    '/admin/bookings?page=1&limit=10'
  ];

  for (const ep of endpoints) {
    await measureEndpoint(token, ep);
  }
}

main().catch(console.error);

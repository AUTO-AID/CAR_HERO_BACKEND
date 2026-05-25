const axios = require('axios');

const http = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  validateStatus: () => true,
  timeout: 5000,
});

const e2eData = {
  customerPhone: '+963991112222',
  customerPass: 'Customer@123',
  customerName: 'Ahmad Customer',
  providerPhone: '+963992223333',
  providerPass: 'Provider@123',
  providerName: 'Super Workshop Tech',
  adminEmail: 'admin@carhero.com',
  adminPass: 'Admin@123',
};

async function main() {
  console.log('--- RUNNING ONLY E2E SCENARIO ---');

  // Clear existing users from local MongoDB test database to make sure it's clean
  const mongoose = require('mongoose');
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/car_hero_test');
    console.log('Connected to MongoDB.');
    await mongoose.connection.db.dropDatabase();
    console.log('Cleaned local test database.');
    await mongoose.disconnect();
  } catch (err) {
    console.log('MongoDB connection/clean failed (maybe mongoose not installed?):', err.message);
  }

  // Seed plans & services
  console.log('\nRunning database seeder...');
  const { execSync } = require('child_process');
  try {
    execSync('npm run seed', { stdio: 'inherit' });
    console.log('Seeder complete.');
  } catch (err) {
    console.log('Seeder run failed:', err.message);
  }

  // 1. Register Customer
  console.log('\n[1] Register Customer...');
  let res = await http.post('/auth/register', {
    fullName: e2eData.customerName,
    phoneNumber: e2eData.customerPhone,
    password: e2eData.customerPass,
    isTermsAccepted: true,
  });
  console.log('Status:', res.status, JSON.stringify(res.data));

  // 2. Verify OTP Customer
  console.log('\n[2] Verify OTP Customer...');
  res = await http.post('/auth/verify-otp', {
    phoneNumber: e2eData.customerPhone,
    otpCode: '123456',
  });
  console.log('Status:', res.status, JSON.stringify(res.data));
  const customerToken = res.data.data ? res.data.data.accessToken : res.data.accessToken;
  const customerUserId = res.data.data ? (res.data.data.user?.id || res.data.data.user?._id) : (res.data.user?.id || res.data.user?._id);
  console.log('Customer token:', customerToken ? 'Extracted' : 'FAILED');

  // 3. Login Customer
  console.log('\n[3] Login Customer...');
  res = await http.post('/auth/login', {
    phoneNumber: e2eData.customerPhone,
    password: e2eData.customerPass,
  });
  console.log('Status:', res.status);

  // 4. Register Provider
  console.log('\n[4] Register Provider...');
  res = await http.post('/auth/register', {
    fullName: e2eData.providerName,
    phoneNumber: e2eData.providerPhone,
    password: e2eData.providerPass,
    accountType: 'provider',
    isTermsAccepted: true,
  });
  console.log('Status:', res.status);

  // 5. Verify OTP Provider
  console.log('\n[5] Verify OTP Provider...');
  res = await http.post('/auth/verify-otp', {
    phoneNumber: e2eData.providerPhone,
    otpCode: '123456',
  });
  console.log('Status:', res.status);

  // 6. Login Admin
  console.log('\n[6] Login Admin...');
  res = await http.post('/admin/login', {
    email: e2eData.adminEmail,
    password: e2eData.adminPass,
  });
  console.log('Status:', res.status);
  const adminToken = res.data.data ? res.data.data.accessToken : res.data.accessToken;
  console.log('Admin token:', adminToken ? 'Extracted' : 'FAILED');

  // 7. Get Provider list via Admin
  console.log('\n[7] Querying Provider list...');
  res = await http.get('/admin/providers', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Status:', res.status);
  let providerId = '';
  const providersList = res.data.data ? res.data.data.providers : res.data.providers;
  if (res.status === 200 && providersList) {
    console.log('Providers count:', providersList.length);
    const prov = providersList.find(p => p.phone === e2eData.providerPhone);
    if (prov) {
      providerId = prov.id || prov._id;
      console.log('Found provider ID:', providerId);
    }
  }

  // 8. Approve Provider
  if (providerId) {
    console.log('\n[8] Approving Provider...');
    res = await http.patch(`/admin/providers/${providerId}/approve`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('Status:', res.status, JSON.stringify(res.data));
  }

  // 9. Login Provider
  console.log('\n[9] Login Provider...');
  res = await http.post('/auth/login', {
    phoneNumber: e2eData.providerPhone,
    password: e2eData.providerPass,
  });
  console.log('Status:', res.status, JSON.stringify(res.data));
}

main().catch(console.error);

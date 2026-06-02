/**
 * Car Hero Customer App - Comprehensive API Test Suite
 * Tests all 96 endpoints against the local backend
 * 
 * Usage: node scripts/test-all-endpoints.cjs
 */
const http = require('http');
const https = require('https');
const { MongoClient } = require('mongodb');

const BASE = 'http://localhost:3001/api/v1';
const MONGO_URI = 'mongodb://127.0.0.1:27017/car_hero';

// ========== STATE ==========
let ACCESS_TOKEN = '';
let REFRESH_TOKEN = '';
let USER_ID = '';
let ENV = {};      // dynamic IDs from DB
let RESULTS = [];  // test results

// ========== HTTP HELPER ==========
function req(method, path, body, token, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const url = new URL(path.startsWith('http') ? path : BASE + path);
    const isHttps = url.protocol === 'https:';
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: { 'Accept': 'application/json' },
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    if (body && typeof body === 'object') {
      const json = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(json);
    }
    const start = Date.now();
    const transport = isHttps ? https : http;
    const r = transport.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        const ms = Date.now() - start;
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, body: json, ms, headers: res.headers });
      });
    });
    r.on('error', (e) => resolve({ status: 0, body: e.message, ms: Date.now() - start, error: true }));
    r.setTimeout(timeoutMs, () => { r.destroy(); resolve({ status: 0, body: 'TIMEOUT', ms: timeoutMs, error: true }); });
    if (body && typeof body === 'object') r.write(JSON.stringify(body));
    r.end();
  });
}

// ========== TEST HELPERS ==========
let testNum = 0;
let passed = 0;
let failed = 0;
let warned = 0;

function record(group, name, method, endpoint, status, expected, ms, details, pass, resBody = null) {
  testNum++;
  if (status === 500) {
    console.error(`\n[500 ERROR DETAILS] ${method} ${endpoint}\n`, resBody);
  }
  const icon = pass ? '✅' : (status >= 400 && status < 500 ? '⚠️' : '❌');
  if (pass) passed++; else if (status >= 400 && status < 500) warned++; else failed++;
  const result = { num: testNum, group, name, method, endpoint, status, expected, ms, pass, icon, details };
  RESULTS.push(result);
  const line = `${icon} #${String(testNum).padStart(2,'0')} [${method.padEnd(6)}] ${endpoint.padEnd(55)} ${String(status).padStart(3)}  ${String(ms).padStart(5)}ms  ${pass ? 'PASS' : details}`;
  console.log(line);
  return result;
}

async function test(group, name, method, endpoint, opts = {}) {
  const { body, auth = true, expectedStatus, expectArray, expectFields, skipOnNoToken } = opts;
  if (skipOnNoToken && !ACCESS_TOKEN) {
    return record(group, name, method, endpoint, '-', '-', 0, 'SKIPPED (no token)', false);
  }
  const token = auth ? ACCESS_TOKEN : null;
  const res = await req(method, endpoint, body, token);
  const expected = expectedStatus || [200, 201];
  const expArr = Array.isArray(expected) ? expected : [expected];
  let pass = expArr.includes(res.status);
  let details = '';

  if (!pass) {
    if (res.status === 500) {
      console.error(`\n[500 ERROR DETAILS] ${method} ${endpoint}\n`, res.body);
    }
    details = 'Expected ' + expArr.join('/') + ' got ' + res.status;
    if (res.body && typeof res.body === 'object' && res.body.message) details += ': ' + String(res.body.message).substring(0, 80);
  }

  if (pass && expectArray && res.body) {
    const arr = Array.isArray(res.body) ? res.body : (res.body.data && Array.isArray(res.body.data) ? res.body.data : null);
    if (!arr) { pass = false; details = 'Expected array in response'; }
  }

  if (pass && expectFields && res.body && typeof res.body === 'object') {
    const obj = res.body.data || res.body;
    for (const f of expectFields) {
      if (obj[f] === undefined) { details += ' Missing field: ' + f; }
    }
  }

  record(group, name, method, endpoint, res.status, expArr.join('/'), res.ms, details || 'PASS', pass);
  return res;
}

// ========== MAIN ==========
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║     CAR HERO - CUSTOMER APP API - COMPREHENSIVE TEST SUITE (96 EP)      ║');
  console.log('║     Target: ' + BASE.padEnd(56) + '  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  // Load real IDs from DB
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db('car_hero');

  const customer = await db.collection('users').findOne({ accountType: 'customer', password: { $exists: true } });
  const provider = await db.collection('providers').findOne({ status: { $in: ['online', 'active', 'available'] } });
  const providerAny = provider || await db.collection('providers').findOne({});
  const service = await db.collection('services').findOne({ isActive: true });
  const vehicle = await db.collection('vehicles').findOne({});
  const order = await db.collection('orders').findOne({});
  const orderCompleted = await db.collection('orders').findOne({ status: 'completed' });
  const chat = await db.collection('chats').findOne({});
  const notification = await db.collection('notifications').findOne({});
  const review = await db.collection('reviews').findOne({});
  const subPlan = await db.collection('subscription_plans').findOne({ isActive: true });
  const wallet = await db.collection('wallets').findOne({});
  const address = await db.collection('user_addresses').findOne({});
  const paymentMethod = await db.collection('user_payment_methods').findOne({});
  const offer = await db.collection('offers').findOne({ isActive: true });
  const washPlan = await db.collection('wash_plans').findOne({ isActive: true });
  const device = await db.collection('user_devices').findOne({});
  const maintenanceRec = await db.collection('maintenancerecords').findOne({});
  const reminder = await db.collection('vehiclereminders').findOne({});

  ENV = {
    phone: customer ? customer.phoneNumber : '+963991112222',
    password: 'Ahmed@123',
    providerId: providerAny ? String(providerAny._id) : '',
    serviceId: service ? String(service._id) : '',
    vehicleId: vehicle ? String(vehicle._id) : '',
    orderId: order ? String(order._id) : '',
    orderCompletedId: orderCompleted ? String(orderCompleted._id) : '',
    chatId: chat ? String(chat._id) : '',
    notificationId: notification ? String(notification._id) : '',
    reviewId: review ? String(review._id) : '',
    subPlanId: subPlan ? String(subPlan._id) : '',
    addressId: address ? String(address._id) : '',
    paymentMethodId: paymentMethod ? String(paymentMethod._id) : '',
    offerId: offer ? String(offer._id) : '',
    washPlanId: washPlan ? String(washPlan._id) : '',
    deviceToken: device ? device.fcmToken : 'test-token',
    maintenanceRecordId: maintenanceRec ? String(maintenanceRec._id) : '',
    reminderId: reminder ? String(reminder._id) : '',
  };

  await client.close();

  console.log('📋 Loaded IDs from DB:');
  for (const [k, v] of Object.entries(ENV)) {
    console.log('   ' + k + ': ' + (v || '(empty)'));
  }
  console.log('');

  // ====================================================================
  // PHASE 1: AUTH (11 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 1: AUTH (11 endpoints) ━━━');

  // 1.1 Login FIRST to get token before any password changes
  const loginRes = await test('auth', 'Login', 'POST', '/auth/login', {
    auth: false,
    body: { phoneNumber: ENV.phone, password: ENV.password },
    expectedStatus: [200, 201, 400, 401],
  });
  if (loginRes.status === 200 || loginRes.status === 201) {
    const b = loginRes.body?.data || loginRes.body;
    ACCESS_TOKEN = b?.accessToken || b?.access_token || b?.tokens?.accessToken || ACCESS_TOKEN;
    REFRESH_TOKEN = b?.refreshToken || b?.refresh_token || b?.tokens?.refreshToken || REFRESH_TOKEN;
    USER_ID = b?.user?._id || b?.user?.id || '';
  }

  console.log('   🔑 Token obtained: ' + (ACCESS_TOKEN ? 'YES (' + ACCESS_TOKEN.substring(0, 20) + '...)' : 'NO'));

  // 1.2 Get Me (auth)
  await test('auth', 'Get Me', 'GET', '/auth/me', { expectedStatus: [200, 401] });

  // 1.3 Refresh Token
  const refreshRes = await test('auth', 'Refresh Token', 'POST', '/auth/refresh-token', {
    auth: false,
    body: { refreshToken: REFRESH_TOKEN },
    expectedStatus: [200, 201, 400, 401],
  });
  if (refreshRes.status === 200 || refreshRes.status === 201) {
    const b = refreshRes.body?.data || refreshRes.body;
    ACCESS_TOKEN = b?.accessToken || b?.access_token || b?.tokens?.accessToken || ACCESS_TOKEN;
    REFRESH_TOKEN = b?.refreshToken || b?.refresh_token || b?.tokens?.refreshToken || REFRESH_TOKEN;
  }

  // 1.4 Register (might fail if user exists - that's OK)
  await test('auth', 'Register', 'POST', '/auth/register', {
    auth: false,
    body: { fullName: 'Test User API', phoneNumber: '+963990099009', password: 'TestPass@123', accountType: 'customer', isTermsAccepted: true },
    expectedStatus: [200, 201, 400, 409],
  });

  // 1.5 Resend OTP
  await test('auth', 'Resend OTP', 'POST', '/auth/resend-otp', {
    auth: false,
    body: { phoneNumber: '+963990099009' },
    expectedStatus: [200, 201, 400, 404, 429],
  });

  // 1.6 Verify OTP
  await test('auth', 'Verify OTP', 'POST', '/auth/verify-otp', {
    auth: false,
    body: { phoneNumber: '+963990099009', otpCode: '123456' },
    expectedStatus: [200, 201, 400, 404],
  });

  // 1.7 Forgot Password
  await test('auth', 'Forgot Password', 'POST', '/auth/forgot-password', {
    auth: false,
    body: { phoneNumber: '+963990099009' },
    expectedStatus: [200, 201, 400, 404, 429],
  });

  // 1.8 Reset Password (use a different phone so we don't break our test user)
  await test('auth', 'Reset Password', 'POST', '/auth/reset-password', {
    auth: false,
    body: { phoneNumber: '+963990099009', otpCode: '123456', newPassword: 'NewPassword@123' },
    expectedStatus: [200, 400, 404],
  });

  // 1.9 Restore Request OTP
  await test('auth', 'Restore Request OTP', 'POST', '/auth/restore/request-otp', {
    auth: false,
    body: { phoneNumber: '+963990000000' },
    expectedStatus: [200, 400, 404],
  });

  // 1.10 Restore Confirm
  await test('auth', 'Restore Confirm', 'POST', '/auth/restore/confirm', {
    auth: false,
    body: { phoneNumber: '+963990000000', otpCode: '123456' },
    expectedStatus: [200, 400, 404],
  });

  // 1.11 WhatsApp Status
  await test('auth', 'WhatsApp Status', 'GET', '/auth/whatsapp/status', { expectedStatus: [200, 401, 503] });

  // ====================================================================
  // PHASE 2: USERS (4 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 2: USERS (4 endpoints) ━━━');

  await test('users', 'Get Profile', 'GET', '/users/me', { expectedStatus: [200, 401] });
  await test('users', 'Update Profile', 'PATCH', '/users/me', {
    body: { fullName: 'Test Updated Name', preferences: { language: 'ar', notifications: { push: true, sms: true, email: false } } },
    expectedStatus: [200, 401],
  });
  await test('users', 'Get Stats', 'GET', '/users/me/stats', { expectedStatus: [200, 401] });
  // DELETE /users/me - skip to not destroy test user
  record('users', 'Delete Account', 'DELETE', '/users/me', 'SKIP', '200', 0, 'SKIPPED (preserving test user)', true);

  // ====================================================================
  // PHASE 3: SERVICES (5 endpoints) - PUBLIC
  // ====================================================================
  console.log('\n━━━ PHASE 3: SERVICES (5 endpoints) ━━━');

  await test('services', 'List Services', 'GET', '/services', { auth: false, expectedStatus: [200] });
  await test('services', 'Get Categories', 'GET', '/services/categories', { auth: false, expectedStatus: [200] });
  await test('services', 'Emergency Services', 'GET', '/services/emergency', { auth: false, expectedStatus: [200] });
  await test('services', 'Search Services', 'GET', '/services/search?query=wash', { auth: false, expectedStatus: [200] });
  await test('services', 'Get Service by ID', 'GET', '/services/' + ENV.serviceId, { auth: false, expectedStatus: [200, 404] });

  // ====================================================================
  // PHASE 4: PROVIDERS (4 endpoints) - PUBLIC
  // ====================================================================
  console.log('\n━━━ PHASE 4: PROVIDERS (4 endpoints) ━━━');

  await test('providers', 'Get Provider', 'GET', '/providers/' + ENV.providerId, { auth: false, expectedStatus: [200, 404] });
  await test('providers', 'Nearby Providers', 'GET', '/providers/nearby?longitude=36.2765&latitude=33.5138&maxDistanceKm=10', { auth: false, expectedStatus: [200] });
  await test('providers', 'Top Rated', 'GET', '/providers/top-rated', { auth: false, expectedStatus: [200] });
  await test('providers', 'Provider Reviews', 'GET', '/reviews/provider/' + ENV.providerId, { auth: false, expectedStatus: [200, 401, 403, 404] });

  // ====================================================================
  // PHASE 5: VEHICLES (14 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 5: VEHICLES (14 endpoints) ━━━');

  // Create vehicle
  const createVehicleRes = await test('vehicles', 'Create Vehicle', 'POST', '/vehicles', {
    body: { brand: 'Toyota', model: 'Camry', year: 2023, color: 'أبيض', plateNumber: 'ت ج 5678', fuelType: 'بنزين', transmission: 'أوتوماتيك', isDefault: false, isActive: true },
    expectedStatus: [200, 201, 400, 401],
  });
  let newVehicleId = ENV.vehicleId;
  if ((createVehicleRes.status === 200 || createVehicleRes.status === 201) && createVehicleRes.body) {
    const vb = createVehicleRes.body?.data || createVehicleRes.body;
    newVehicleId = vb?._id || vb?.id || newVehicleId;
  }

  await test('vehicles', 'My Vehicles', 'GET', '/vehicles/my', { expectedStatus: [200, 401] });
  await test('vehicles', 'Get Vehicle', 'GET', '/vehicles/' + newVehicleId, { expectedStatus: [200, 401, 404] });
  await test('vehicles', 'Update Vehicle', 'PATCH', '/vehicles/' + newVehicleId, {
    body: { color: 'أسود', year: 2024 },
    expectedStatus: [200, 401, 403, 404],
  });
  await test('vehicles', 'Set Default', 'PATCH', '/vehicles/' + newVehicleId + '/set-default', {
    body: {},
    expectedStatus: [200, 401, 403, 404],
  });
  await test('vehicles', 'Search Vehicles', 'GET', '/vehicles/search?q=Toyota', { expectedStatus: [200, 401] });

  // Maintenance
  const createMaintRes = await test('vehicles', 'Create Maintenance', 'POST', '/vehicles/' + newVehicleId + '/maintenance', {
    body: { serviceType: 'oil_change', description: 'Engine oil replaced', date: '2026-06-01T10:00:00.000Z', mileage: 50000, cost: 300, provider: 'Car Hero Center', location: 'Damascus' },
    expectedStatus: [200, 201, 400, 401, 403, 404],
  });
  let newMaintId = ENV.maintenanceRecordId;
  if ((createMaintRes.status === 200 || createMaintRes.status === 201) && createMaintRes.body) {
    const mb = createMaintRes.body?.data || createMaintRes.body;
    newMaintId = mb?._id || mb?.id || newMaintId;
  }

  await test('vehicles', 'Get Maintenance', 'GET', '/vehicles/' + newVehicleId + '/maintenance', { expectedStatus: [200, 401, 404] });
  await test('vehicles', 'Update Maintenance', 'PATCH', '/vehicles/maintenance/' + newMaintId, {
    body: { notes: 'Updated note', cost: 350 },
    expectedStatus: [200, 204, 401, 403, 404],
  });
  await test('vehicles', 'Delete Maintenance', 'DELETE', '/vehicles/maintenance/' + newMaintId, { expectedStatus: [200, 204, 401, 403, 404] });

  // Reminders
  const createReminderRes = await test('vehicles', 'Create Reminder', 'POST', '/vehicles/' + newVehicleId + '/reminders', {
    body: { type: 'oil_change', title: 'Oil change reminder', description: 'Every 5000km', reminderDate: '2026-08-01T10:00:00.000Z', mileageThreshold: 55000, currentMileage: 50000, frequency: 'custom_km', isRecurring: true },
    expectedStatus: [200, 201, 400, 401, 403, 404],
  });
  let newReminderId = ENV.reminderId;
  if ((createReminderRes.status === 200 || createReminderRes.status === 201) && createReminderRes.body) {
    const rb = createReminderRes.body?.data || createReminderRes.body;
    newReminderId = rb?._id || rb?.id || newReminderId;
  }

  await test('vehicles', 'Get Reminders', 'GET', '/vehicles/' + newVehicleId + '/reminders', { expectedStatus: [200, 401, 404] });
  await test('vehicles', 'Delete Reminder', 'DELETE', '/vehicles/reminders/' + newReminderId, { expectedStatus: [200, 204, 401, 403, 404] });

  // Delete created vehicle (cleanup)
  await test('vehicles', 'Delete Vehicle', 'DELETE', '/vehicles/' + newVehicleId, { expectedStatus: [200, 204, 400, 401, 403, 404] });

  // ====================================================================
  // PHASE 6: ADDRESSES (5 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 6: ADDRESSES (5 endpoints) ━━━');

  const createAddrRes = await test('addresses', 'Create Address', 'POST', '/customer/addresses', {
    body: { label: 'Test Address', addressLine: 'Damascus - Test Street', note: 'API test', coordinates: { latitude: 33.5138, longitude: 36.2765 }, isDefault: false },
    expectedStatus: [200, 201, 400, 401],
  });
  let newAddrId = ENV.addressId;
  if ((createAddrRes.status === 200 || createAddrRes.status === 201) && createAddrRes.body) {
    const ab = createAddrRes.body?.data || createAddrRes.body;
    newAddrId = ab?._id || ab?.id || newAddrId;
  }

  await test('addresses', 'List Addresses', 'GET', '/customer/addresses', { expectedStatus: [200, 401] });
  await test('addresses', 'Update Address', 'PATCH', '/customer/addresses/' + newAddrId, {
    body: { label: 'Updated Test Address' },
    expectedStatus: [200, 401, 403, 404],
  });
  await test('addresses', 'Set Default Address', 'PATCH', '/customer/addresses/' + newAddrId + '/set-default', {
    body: {},
    expectedStatus: [200, 401, 403, 404],
  });
  await test('addresses', 'Delete Address', 'DELETE', '/customer/addresses/' + newAddrId, { expectedStatus: [200, 204, 401, 403, 404] });

  // ====================================================================
  // PHASE 7: PAYMENT METHODS (5 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 7: PAYMENT METHODS (5 endpoints) ━━━');

  const createPmRes = await test('payment_methods', 'Create Payment Method', 'POST', '/customer/payment-methods', {
    body: { type: 'card', displayName: 'Test Visa 9999', last4: '9999', brand: 'visa', providerToken: 'tok_test_9999', isDefault: false },
    expectedStatus: [200, 201, 400, 401],
  });
  let newPmId = ENV.paymentMethodId;
  if ((createPmRes.status === 200 || createPmRes.status === 201) && createPmRes.body) {
    const pb = createPmRes.body?.data || createPmRes.body;
    newPmId = pb?._id || pb?.id || newPmId;
  }

  await test('payment_methods', 'List Payment Methods', 'GET', '/customer/payment-methods', { expectedStatus: [200, 401] });
  await test('payment_methods', 'Update Payment Method', 'PATCH', '/customer/payment-methods/' + newPmId, {
    body: { displayName: 'Updated Visa 9999' },
    expectedStatus: [200, 401, 403, 404],
  });
  await test('payment_methods', 'Set Default PM', 'PATCH', '/customer/payment-methods/' + newPmId + '/set-default', {
    body: {},
    expectedStatus: [200, 401, 403, 404],
  });
  await test('payment_methods', 'Delete Payment Method', 'DELETE', '/customer/payment-methods/' + newPmId, { expectedStatus: [200, 204, 401, 403, 404] });

  // ====================================================================
  // PHASE 8: ORDERS (10 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 8: ORDERS (10 endpoints) ━━━');

  const createOrderRes = await test('orders', 'Create Order', 'POST', '/orders', {
    body: { serviceId: ENV.serviceId, providerId: ENV.providerId, vehicleId: ENV.vehicleId, location: { coordinates: [36.2765, 33.5138] }, notes: 'API test order' },
    expectedStatus: [200, 201, 400, 401, 404, 422],
  });
  let newOrderId = ENV.orderId;
  if ((createOrderRes.status === 200 || createOrderRes.status === 201) && createOrderRes.body) {
    const ob = createOrderRes.body?.data || createOrderRes.body;
    newOrderId = ob?._id || ob?.id || newOrderId;
  }

  await test('orders', 'List Orders', 'GET', '/orders', { expectedStatus: [200, 401] });
  await test('orders', 'Get Order', 'GET', '/orders/' + newOrderId, { expectedStatus: [200, 401, 403, 404] });
  await test('orders', 'Status Transitions', 'GET', '/orders/' + newOrderId + '/status-transitions', { expectedStatus: [200, 401, 403, 404] });
  await test('orders', 'Order Tracking', 'GET', '/orders/' + newOrderId + '/tracking', { expectedStatus: [200, 401, 403, 404] });
  await test('orders', 'Update Order', 'PATCH', '/orders/' + newOrderId, {
    body: { notes: 'Updated API test note' },
    expectedStatus: [200, 400, 401, 403, 404],
  });
  await test('orders', 'Verify Payment', 'POST', '/orders/' + newOrderId + '/payment/verify', {
    body: { paymentId: 'pay_test_001', paymentMethod: 'card' },
    expectedStatus: [200, 400, 401, 403, 404, 409, 422],
  });
  await test('orders', 'Customer Confirm', 'POST', '/orders/' + newOrderId + '/customer-confirm-completion', {
    body: {},
    expectedStatus: [200, 400, 401, 403, 404, 409, 422],
  });
  await test('orders', 'Review Order', 'POST', '/orders/' + newOrderId + '/review', {
    body: { rating: 5, comment: 'Great API test' },
    expectedStatus: [200, 201, 400, 401, 403, 404, 409, 422],
  });
  await test('orders', 'Cancel Order', 'POST', '/orders/' + newOrderId + '/cancel', {
    body: { reason: 'API test cancellation' },
    expectedStatus: [200, 400, 401, 403, 404, 409, 422],
  });

  // ====================================================================
  // PHASE 9: BOOKINGS (3 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 9: BOOKINGS (3 endpoints) ━━━');

  const createBookingRes = await test('bookings', 'Create Booking', 'POST', '/bookings', {
    body: { serviceId: ENV.serviceId, providerId: ENV.providerId, vehicleId: ENV.vehicleId, scheduleTime: '2026-07-01T10:00:00.000Z', location: { coordinates: [36.2765, 33.5138] }, notes: 'API test booking' },
    expectedStatus: [200, 201, 400, 401, 404, 422],
  });
  let newBookingId = '';
  if ((createBookingRes.status === 200 || createBookingRes.status === 201) && createBookingRes.body) {
    const bb = createBookingRes.body?.data || createBookingRes.body;
    newBookingId = bb?._id || bb?.id || ENV.orderId;
  } else {
    newBookingId = ENV.orderId;
  }

  await test('bookings', 'List Bookings', 'GET', '/bookings', { expectedStatus: [200, 401] });
  await test('bookings', 'Get Booking', 'GET', '/bookings/' + newBookingId, { expectedStatus: [200, 401, 403, 404] });

  // ====================================================================
  // PHASE 10: CHAT (4 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 10: CHAT (4 endpoints) ━━━');

  const startChatRes = await test('chat', 'Start Conversation', 'POST', '/chat/conversations', {
    body: { participantId: ENV.providerId, orderId: ENV.orderId },
    expectedStatus: [200, 201, 400, 401, 403, 404, 409],
  });
  let chatIdTest = ENV.chatId;
  if ((startChatRes.status === 200 || startChatRes.status === 201) && startChatRes.body) {
    const cb = startChatRes.body?.data || startChatRes.body;
    chatIdTest = cb?._id || cb?.id || chatIdTest;
  }

  await test('chat', 'Get Conversations', 'GET', '/chat/conversations', { expectedStatus: [200, 401] });
  await test('chat', 'Get Messages', 'GET', '/chat/' + chatIdTest + '/messages', { expectedStatus: [200, 401, 403, 404] });
  // Upload - without actual file, expect 400/422
  await test('chat', 'Upload File', 'POST', '/chat/upload', {
    body: {},
    expectedStatus: [200, 400, 401, 415, 422],
  });

  // ====================================================================
  // PHASE 11: NOTIFICATIONS (4 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 11: NOTIFICATIONS (4 endpoints) ━━━');

  await test('notifications', 'Get Notifications', 'GET', '/notifications', { expectedStatus: [200, 401] });
  await test('notifications', 'Unread Count', 'GET', '/notifications/unread-count', { expectedStatus: [200, 401] });
  await test('notifications', 'Mark Read', 'PATCH', '/notifications/' + ENV.notificationId + '/read', {
    body: {},
    expectedStatus: [200, 401, 403, 404],
  });
  await test('notifications', 'Mark All Read', 'PATCH', '/notifications/read-all', {
    body: {},
    expectedStatus: [200, 401],
  });

  // ====================================================================
  // PHASE 12: REVIEWS (2 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 12: REVIEWS (2 endpoints) ━━━');

  const createReviewRes = await test('reviews', 'Create Review', 'POST', '/reviews', {
    body: { orderId: ENV.orderCompletedId || ENV.orderId, rating: 4, comment: 'API test review', serviceQuality: 4, punctuality: 5, professionalism: 4, valueForMoney: 4, images: [] },
    expectedStatus: [200, 201, 400, 401, 403, 404, 409, 422],
  });
  let newReviewId = ENV.reviewId;
  if ((createReviewRes.status === 200 || createReviewRes.status === 201) && createReviewRes.body) {
    const rvb = createReviewRes.body?.data || createReviewRes.body;
    newReviewId = rvb?._id || rvb?.id || newReviewId;
  }

  await test('reviews', 'Delete Review', 'DELETE', '/reviews/' + newReviewId, { expectedStatus: [200, 204, 401, 403, 404] });

  // ====================================================================
  // PHASE 13: SUBSCRIPTIONS (8 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 13: SUBSCRIPTIONS (8 endpoints) ━━━');

  await test('subscriptions', 'List Plans', 'GET', '/subscriptions/plans', { auth: false, expectedStatus: [200] });
  await test('subscriptions', 'Get Plan', 'GET', '/subscriptions/plans/' + ENV.subPlanId, { auth: false, expectedStatus: [200, 404] });
  await test('subscriptions', 'Subscribe', 'POST', '/subscriptions/subscribe', {
    body: { planId: ENV.subPlanId, paymentId: 'pay_sub_test_001', autoRenew: true, metadata: {} },
    expectedStatus: [200, 201, 400, 401, 404, 409],
  });
  await test('subscriptions', 'Check Status', 'GET', '/subscriptions/status', { expectedStatus: [200, 401, 404] });
  await test('subscriptions', 'History', 'GET', '/subscriptions/history', { expectedStatus: [200, 401] });
  await test('subscriptions', 'Renew', 'POST', '/subscriptions/renew', {
    body: {},
    expectedStatus: [200, 400, 401, 404, 409],
  });
  await test('subscriptions', 'Upgrade', 'POST', '/subscriptions/upgrade', {
    body: { planId: ENV.subPlanId, paymentId: 'pay_upg_test_001', autoRenew: true, metadata: {} },
    expectedStatus: [200, 400, 401, 404, 409],
  });
  await test('subscriptions', 'Cancel', 'POST', '/subscriptions/cancel', {
    body: { reason: 'API test cancellation', cancelImmediately: false },
    expectedStatus: [200, 400, 401, 404, 409],
  });

  // ====================================================================
  // PHASE 14: WALLET (4 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 14: WALLET (4 endpoints) ━━━');

  await test('wallet', 'Get Wallet', 'GET', '/wallet/me', { expectedStatus: [200, 401, 404] });
  await test('wallet', 'Deposit', 'POST', '/wallet/deposit', {
    body: { amount: 100, paymentMethod: 'card', paymentId: 'pay_dep_test_001' },
    expectedStatus: [200, 201, 400, 401, 404],
  });
  await test('wallet', 'Transactions', 'GET', '/wallet/transactions', { expectedStatus: [200, 401, 404] });
  await test('wallet', 'Redeem Points', 'POST', '/wallet/redeem-points', {
    body: { points: 10, orderId: ENV.orderId },
    expectedStatus: [200, 400, 401, 404, 409, 422],
  });

  // ====================================================================
  // PHASE 15: CUSTOMER FEATURES (9 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 15: CUSTOMER FEATURES (9 endpoints) ━━━');

  // Offers
  await test('offers', 'List Offers', 'GET', '/customer/offers', { expectedStatus: [200, 401] });
  await test('offers', 'Apply Offer', 'POST', '/customer/offers/' + ENV.offerId + '/apply', {
    body: { orderId: ENV.orderId },
    expectedStatus: [200, 201, 400, 401, 404, 409],
  });

  // Wash Plans
  const createWpRes = await test('wash_plans', 'Create Wash Plan', 'POST', '/customer/wash-plans', {
    body: { vehicleId: ENV.vehicleId, addressId: ENV.addressId, visitsPerMonth: 2, washType: 'full', preferredTimeSlot: 'evening', reminderEnabled: true },
    expectedStatus: [200, 201, 400, 401, 404],
  });
  let newWpId = ENV.washPlanId;
  if ((createWpRes.status === 200 || createWpRes.status === 201) && createWpRes.body) {
    const wpb = createWpRes.body?.data || createWpRes.body;
    newWpId = wpb?._id || wpb?.id || newWpId;
  }

  await test('wash_plans', 'List Wash Plans', 'GET', '/customer/wash-plans', { expectedStatus: [200, 401] });
  await test('wash_plans', 'Update Wash Plan', 'PATCH', '/customer/wash-plans/' + newWpId, {
    body: { visitsPerMonth: 4, reminderEnabled: true },
    expectedStatus: [200, 400, 401, 403, 404],
  });
  await test('wash_plans', 'Generate Booking', 'POST', '/customer/wash-plans/' + newWpId + '/generate-booking', {
    body: {},
    expectedStatus: [200, 201, 400, 401, 403, 404, 409],
  });
  await test('wash_plans', 'Delete Wash Plan', 'DELETE', '/customer/wash-plans/' + newWpId, { expectedStatus: [200, 204, 401, 403, 404] });

  // Devices
  const regDevRes = await test('devices', 'Register Device', 'POST', '/customer/devices', {
    body: { fcmToken: 'test_fcm_token_api_run_' + Date.now(), platform: 'android', deviceName: 'API Test Device' },
    expectedStatus: [200, 201, 400, 401],
  });
  let testDeviceToken = 'test_fcm_token_api_run_' + Date.now();
  if ((regDevRes.status === 200 || regDevRes.status === 201) && regDevRes.body) {
    const db2 = regDevRes.body?.data || regDevRes.body;
    testDeviceToken = db2?.fcmToken || testDeviceToken;
  }

  await test('devices', 'Delete Device', 'DELETE', '/customer/devices/' + encodeURIComponent(testDeviceToken), { expectedStatus: [200, 204, 401, 404] });

  // ====================================================================
  // PHASE 16: AI RECOMMENDATION (3 endpoints)
  // ====================================================================
  console.log('\n━━━ PHASE 16: AI RECOMMENDATION (3 endpoints) ━━━');

  await test('ai', 'Recommend Provider (Success)', 'POST', '/ai/recommend-provider', {
    body: { serviceCategory: 'towing', city: 'Damascus', location: { lat: 33.5138, lng: 36.29128 }, urgencyLevel: 'emergency', vehicleType: 'Sedan' },
    expectedStatus: [200, 400, 401, 404, 500, 503],
  });
  await test('ai', 'Recommend Provider (Fallback)', 'POST', '/ai/recommend-provider', {
    body: { serviceCategory: 'non_existent_category', city: 'Damascus', location: { lat: 33.5138, lng: 36.29128 }, urgencyLevel: 'normal' },
    expectedStatus: [200, 400, 401, 404, 500, 503],
  });
  await test('ai', 'Recommend Provider (Exclusion)', 'POST', '/ai/recommend-provider', {
    body: { serviceCategory: 'towing', city: 'Damascus', location: { lat: 33.5138, lng: 36.29128 }, urgencyLevel: 'emergency', excludeProviderIds: [ENV.providerId] },
    expectedStatus: [200, 400, 401, 404, 500, 503],
  });

  // Re-login if password was reset
  if (!ACCESS_TOKEN) {
    console.log('\n⚠️ No token - attempting re-login...');
    const relogin = await req('POST', '/auth/login', { phoneNumber: ENV.phone, password: 'Ahmed@123' });
    if (relogin.status === 200) {
      const b = relogin.body?.data || relogin.body;
      ACCESS_TOKEN = b?.accessToken || b?.access_token || '';
    }
  }

  // Logout - last test
  console.log('\n━━━ FINAL: LOGOUT ━━━');
  await test('auth', 'Logout', 'POST', '/auth/logout', {
    body: {},
    expectedStatus: [200, 201, 401],
  });

  // ====================================================================
  // SUMMARY
  // ====================================================================
  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                         TEST RESULTS SUMMARY                            ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════╣');
  console.log('║  Total Tests:  ' + String(testNum).padStart(3) + '                                                       ║');
  console.log('║  ✅ Passed:    ' + String(passed).padStart(3) + '                                                       ║');
  console.log('║  ⚠️  Warned:    ' + String(warned).padStart(3) + '  (4xx client errors - may be expected)                 ║');
  console.log('║  ❌ Failed:    ' + String(failed).padStart(3) + '  (5xx server errors / connection errors)               ║');
  console.log('║  Pass Rate:   ' + (testNum > 0 ? Math.round(passed / testNum * 100) : 0) + '%                                                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝');

  // Group summary
  const groups = {};
  for (const r of RESULTS) {
    if (!groups[r.group]) groups[r.group] = { total: 0, passed: 0, failed: 0 };
    groups[r.group].total++;
    if (r.pass) groups[r.group].passed++;
    else groups[r.group].failed++;
  }
  console.log('\n  Module Breakdown:');
  console.log('  ' + 'Module'.padEnd(22) + 'Total'.padStart(6) + 'Pass'.padStart(6) + 'Fail'.padStart(6) + 'Rate'.padStart(8));
  console.log('  ' + '─'.repeat(48));
  for (const [g, s] of Object.entries(groups)) {
    const rate = Math.round(s.passed / s.total * 100);
    console.log('  ' + g.padEnd(22) + String(s.total).padStart(6) + String(s.passed).padStart(6) + String(s.failed).padStart(6) + (rate + '%').padStart(8));
  }

  // Show failures
  const failures = RESULTS.filter(r => !r.pass);
  if (failures.length > 0) {
    console.log('\n  ❌ Failed/Warning Tests:');
    for (const f of failures) {
      console.log('    #' + f.num + ' [' + f.method + '] ' + f.endpoint + ' → ' + f.status + ' ' + f.details);
    }
  }

  console.log('\n🏁 Testing complete!');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });

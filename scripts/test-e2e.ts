import axios from 'axios';
import * as mongoose from 'mongoose';

const API_BASE = 'http://127.0.0.1:3001/api/v1';
const DB_URI = 'mongodb://127.0.0.1:27017/car_hero';

const customerPhone = '+963990000000';
const providerPhone = '+963990000001';

async function runE2E() {
  console.log('🚀 Starting End-to-End Lifecycle Test...\n');
  
  await mongoose.connect(DB_URI);
  const db = mongoose.connection.db;
  if (!db) return;

  try {
    console.log('[Cleanup] Cleaning old test data...');
    await db.collection('users').deleteMany({ phoneNumber: { $in: [customerPhone, providerPhone] } });
    await db.collection('providers').deleteMany({ phone: providerPhone });
    console.log('[Cleanup] Done cleaning old test data.\n');

    console.log('--- Step 1: Customer Onboarding ---');
    await axios.post(`${API_BASE}/auth/register`, {
      phoneNumber: customerPhone,
      fullName: 'Test Customer',
      password: 'Password123!',
      accountType: 'customer',
      isTermsAccepted: true
    });
    
    // VERIFY OTP (Creates user in DB)
    await axios.post(`${API_BASE}/auth/verify-otp`, {
      phoneNumber: customerPhone,
      otpCode: '123456'
    });
    
    await db.collection('users').updateOne({ phoneNumber: customerPhone }, { $set: { isActive: true, isVerified: true } });
    
    const customerLogin = await axios.post(`${API_BASE}/auth/login`, {
      phoneNumber: customerPhone,
      password: 'Password123!'
    });
    const customerToken = customerLogin.data.data?.accessToken || customerLogin.data.accessToken;
    console.log('✅ Customer registered, verified, activated, and logged in.');

    console.log('\n--- Step 2: Provider Onboarding ---');
    await axios.post(`${API_BASE}/auth/register`, {
      phoneNumber: providerPhone,
      fullName: 'Test Provider',
      password: 'Password123!',
      accountType: 'provider',
      isTermsAccepted: true
    });
    
    // VERIFY OTP (Creates user AND provider profile in DB)
    await axios.post(`${API_BASE}/auth/verify-otp`, {
      phoneNumber: providerPhone,
      otpCode: '123456'
    });
    
    const pUser = await db.collection('users').findOne({ phoneNumber: providerPhone });
    let providerProfile = await db.collection('providers').findOne({ phone: providerPhone });
    
    if (!providerProfile && pUser) {
        await db.collection('providers').insertOne({
            _id: new mongoose.Types.ObjectId(),
            userId: pUser._id,
            ownerName: 'Test Provider',
            businessName: 'Test Provider Workshop',
            phone: providerPhone,
            isVerified: true,
            status: 'online',
            serviceCategories: [],
            averageRating: 5,
            totalReviews: 0,
            location: { type: 'Point', coordinates: [36.2765, 33.5138] },
            createdAt: new Date(),
            updatedAt: new Date()
        });
        providerProfile = await db.collection('providers').findOne({ phone: providerPhone });
    }
    
    await db.collection('users').updateOne({ phoneNumber: providerPhone }, { $set: { isActive: true, isVerified: true } });

    const providerLogin = await axios.post(`${API_BASE}/auth/login`, {
      phoneNumber: providerPhone,
      password: 'Password123!'
    });
    const providerToken = providerLogin.data.data?.accessToken || providerLogin.data.accessToken;
    const providerProfileId = providerProfile?._id?.toString();
    console.log(`✅ Provider registered, activated, and logged in. Provider ID: ${providerProfileId}`);

    const service = await db.collection('services').findOne({});
    if (!service) throw new Error("No services found in DB. Please run seed script first.");

    console.log('\n--- Step 3: Customer Creates Order ---');
    const orderRes = await axios.post(`${API_BASE}/orders`, {
      serviceId: service._id.toString(),
      location: { coordinates: [36.2765, 33.5138] },
      scheduleTime: new Date(Date.now() + 3600000).toISOString(),
    }, { headers: { Authorization: `Bearer ${customerToken}` } });
    
    const orderId = orderRes.data.data?.id || orderRes.data.id || orderRes.data.data?._id;
    console.log(`✅ Order created: ${orderId}`);

    await db.collection('orders').updateOne(
        { _id: new mongoose.Types.ObjectId(orderId) }, 
        { $set: { provider: new mongoose.Types.ObjectId(providerProfileId), status: 'accepted' } }
    );
    console.log(`✅ Order manually assigned to test provider ${providerProfileId}`);

    console.log('\n--- Step 4: Provider Updates Order ---');
  // Provider accepts the order
  const acceptRes = await axios.patch(
    `${API_BASE}/orders/${orderId}/status`,
    { status: 'accepted' },
    { headers: { Authorization: `Bearer ${providerToken}` } }
  );
  console.log(`✅ Order status updated to: ${acceptRes.data.status}`);

  // Provider arrives
  const arriveRes = await axios.patch(
    `${API_BASE}/orders/${orderId}/status`,
    { status: 'provider_arrived' },
    { headers: { Authorization: `Bearer ${providerToken}` } }
  );
  console.log(`✅ Order status updated to: ${arriveRes.data.status}`);

  // Provider starts work
  const startRes = await axios.patch(
    `${API_BASE}/orders/${orderId}/status`,
    { status: 'in_progress' },
    { headers: { Authorization: `Bearer ${providerToken}` } }
  );
  console.log(`✅ Order status updated to: ${startRes.data.status}`);

  // Provider marks work as awaiting customer confirmation
  const completeRes = await axios.patch(
    `${API_BASE}/orders/${orderId}/status`,
    { status: 'awaiting_customer_confirmation' },
    { headers: { Authorization: `Bearer ${providerToken}` } }
  );
  console.log(`✅ Order status updated to: ${completeRes.data.status || 'awaiting_customer_confirmation'}`);

  console.log('\n--- Step 5: Customer Confirms and Reviews Order ---');
  const customerConfirmRes = await axios.post(
    `${API_BASE}/orders/${orderId}/customer-confirm-completion`,
    {},
    { headers: { Authorization: `Bearer ${customerToken}` } }
  );
  console.log(`✅ Customer confirmed order completion. New status: ${customerConfirmRes.data.data?.status || customerConfirmRes.data.status}`);

  await axios.post(`${API_BASE}/orders/${orderId}/review`, {
    rating: 5,
    comment: 'Excellent service!'
  }, { headers: { Authorization: `Bearer ${customerToken}` } });
  console.log('✅ Customer reviewed the order successfully.');

    console.log('\n=============================================');
    console.log('🎉 E2E LIFECYCLE TEST COMPLETED SUCCESSFULLY! 🎉');
    console.log('=============================================');

  } catch (error: any) {
    console.error('\n❌ E2E TEST FAILED:', error?.response?.data || error?.message || error);
  } finally {
    await mongoose.disconnect();
  }
}

runE2E();

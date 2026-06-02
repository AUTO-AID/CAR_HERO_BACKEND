const { MongoClient } = require('mongodb');

async function main() {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017/car_hero', {
    serverSelectionTimeoutMS: 5000
  });
  const db = client.db('car_hero');

  console.log('=== Finding test-ready data for all 96 endpoints ===\n');

  // 1. Find a customer with password (for login test)
  const customers = await db.collection('users').find({ accountType: 'customer' }).limit(5).toArray();
  console.log('--- CUSTOMERS (for auth/login tests) ---');
  for (const c of customers) {
    console.log('  _id: ' + c._id + ' | phone: ' + c.phoneNumber + ' | name: ' + c.fullName + ' | hasPassword: ' + !!c.password);
  }

  // 2. Find active providers
  const providers = await db.collection('providers').find({ status: { $in: ['active', 'online', 'available'] } }).limit(3).toArray();
  console.log('\n--- ACTIVE PROVIDERS ---');
  if (providers.length === 0) {
    const anyProvider = await db.collection('providers').find({}).limit(3).toArray();
    console.log('  (No active providers, showing any):');
    for (const p of anyProvider) {
      console.log('  _id: ' + p._id + ' | status: ' + p.status + ' | business: ' + p.businessName);
    }
  } else {
    for (const p of providers) {
      console.log('  _id: ' + p._id + ' | status: ' + p.status + ' | business: ' + p.businessName);
    }
  }

  // 3. Find services
  const services = await db.collection('services').find({}).limit(5).toArray();
  console.log('\n--- SERVICES ---');
  for (const s of services) {
    console.log('  _id: ' + s._id + ' | name: ' + s.name + ' | category: ' + s.category + ' | isActive: ' + s.isActive);
  }

  // 4. Find vehicles owned by a customer
  const customerIds = customers.map(c => c._id);
  const vehicles = await db.collection('vehicles').find({ userId: { $in: customerIds } }).limit(3).toArray();
  console.log('\n--- VEHICLES (owned by test customers) ---');
  if (vehicles.length === 0) {
    const anyVehicle = await db.collection('vehicles').find({}).limit(3).toArray();
    console.log('  (No vehicles for test customers, showing any):');
    for (const v of anyVehicle) {
      console.log('  _id: ' + v._id + ' | userId: ' + v.userId + ' | brand: ' + v.brand + ' | model: ' + v.model);
    }
  } else {
    for (const v of vehicles) {
      console.log('  _id: ' + v._id + ' | userId: ' + v.userId + ' | brand: ' + v.brand + ' | model: ' + v.model);
    }
  }

  // 5. Find orders  
  const orders = await db.collection('orders').find({}).limit(3).toArray();
  console.log('\n--- ORDERS ---');
  for (const o of orders) {
    console.log('  _id: ' + o._id + ' | customerId: ' + o.customerId + ' | providerId: ' + o.providerId + ' | status: ' + o.status);
  }

  // 6. Subscription plans
  const plans = await db.collection('subscription_plans').find({}).toArray();
  console.log('\n--- SUBSCRIPTION PLANS ---');
  for (const p of plans) {
    console.log('  _id: ' + p._id + ' | name: ' + p.name + ' | price: ' + p.price + ' | isActive: ' + p.isActive);
  }

  // 7. Chats
  const chats = await db.collection('chats').find({}).limit(3).toArray();
  console.log('\n--- CHATS ---');
  for (const c of chats) {
    console.log('  _id: ' + c._id + ' | participants: ' + JSON.stringify(c.participants || c.members || []).substring(0, 80));
  }

  // 8. Reviews
  const reviews = await db.collection('reviews').find({}).limit(3).toArray();
  console.log('\n--- REVIEWS ---');
  for (const r of reviews) {
    console.log('  _id: ' + r._id + ' | orderId: ' + r.orderId + ' | rating: ' + r.rating);
  }

  // 9. Notifications
  const notifs = await db.collection('notifications').find({}).limit(3).toArray();
  console.log('\n--- NOTIFICATIONS ---');
  for (const n of notifs) {
    console.log('  _id: ' + n._id + ' | userId: ' + n.userId + ' | type: ' + n.type + ' | isRead: ' + n.isRead);
  }

  // 10. Wallets
  const wallets = await db.collection('wallets').find({}).limit(3).toArray();
  console.log('\n--- WALLETS ---');
  for (const w of wallets) {
    console.log('  _id: ' + w._id + ' | userId: ' + w.userId + ' | balance: ' + w.balance + ' | points: ' + w.loyaltyPoints);
  }

  // 11. Maintenance records
  const maintenance = await db.collection('maintenancerecords').find({}).limit(2).toArray();
  console.log('\n--- MAINTENANCE RECORDS ---');
  for (const m of maintenance) {
    console.log('  _id: ' + m._id + ' | vehicleId: ' + m.vehicleId + ' | serviceType: ' + m.serviceType);
  }

  // 12. Vehicle reminders
  const reminders = await db.collection('vehiclereminders').find({}).limit(2).toArray();
  console.log('\n--- VEHICLE REMINDERS ---');
  for (const r of reminders) {
    console.log('  _id: ' + r._id + ' | vehicleId: ' + r.vehicleId + ' | type: ' + r.type);
  }

  // Check if server is running
  console.log('\n=== Checking if backend server is running on port 3001 ===');
  const http = require('http');
  const checkServer = () => new Promise((resolve) => {
    const req = http.get('http://localhost:3001/api/v1', (res) => {
      resolve({ running: true, statusCode: res.statusCode });
    });
    req.on('error', (e) => {
      resolve({ running: false, error: e.message });
    });
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ running: false, error: 'Timeout' });
    });
  });

  const serverStatus = await checkServer();
  if (serverStatus.running) {
    console.log('  Server: RUNNING (status: ' + serverStatus.statusCode + ')');
  } else {
    console.log('  Server: NOT RUNNING (' + serverStatus.error + ')');
  }

  await client.close();
}

main().catch(e => console.error('Error:', e.message));

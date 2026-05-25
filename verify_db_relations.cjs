const mongoose = require('mongoose');

async function main() {
  console.log('--- CONNECTING TO MONGODB ---');
  await mongoose.connect('mongodb://127.0.0.1:27017/car_hero_test');
  console.log('Connected.');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('\n--- SYSTEM COLLECTIONS ---');
  collections.forEach(c => console.log(`- ${c.name}`));

  // Check counts
  console.log('\n--- DOCUMENT COUNTS ---');
  const counts = {};
  for (const coll of collections) {
    const count = await db.collection(coll.name).countDocuments();
    counts[coll.name] = count;
    console.log(`${coll.name}: ${count} documents`);
  }

  // Verify Users
  console.log('\n--- VERIFYING USERS ---');
  const users = await db.collection('users').find().toArray();
  users.forEach(u => {
    console.log(`User: ${u.fullName} (${u.phoneNumber}) - Role/AccountType: ${u.accountType} - Active: ${u.isActive}`);
  });

  // Verify Providers
  console.log('\n--- VERIFYING PROVIDERS ---');
  const providers = await db.collection('providers').find().toArray();
  providers.forEach(p => {
    console.log(`Provider: ${p.businessName} (${p.phone}) - Approved: ${p.isApproved} - Status: ${p.registrationStatus}`);
  });

  // Verify Vehicles
  console.log('\n--- VERIFYING VEHICLES ---');
  const vehicles = await db.collection('vehicles').find().toArray();
  vehicles.forEach(v => {
    console.log(`Vehicle: ${v.brand} ${v.model} (${v.plateNumber}) - Owner ID: ${v.owner}`);
  });

  // Verify Orders
  console.log('\n--- VERIFYING ORDERS ---');
  const orders = await db.collection('orders').find().toArray();
  orders.forEach(o => {
    console.log(`Order: ${o.orderNumber} - Customer: ${o.user} - Provider: ${o.provider} - Status: ${o.status} - Total: ${o.totalAmount}`);
  });

  // Verify Reviews
  console.log('\n--- VERIFYING REVIEWS ---');
  const reviews = await db.collection('reviews').find().toArray();
  reviews.forEach(r => {
    console.log(`Review: Rating ${r.rating} - Comment: ${r.comment} - Order: ${r.order} - User: ${r.user}`);
  });

  await mongoose.disconnect();
  console.log('\nDisconnected.');
}

main().catch(console.error);

const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/car_hero_test');
  console.log('Connected to DB');

  const db = mongoose.connection.db;

  const users = await db.collection('users').find({}).toArray();
  console.log('\n--- USERS ---');
  users.forEach(u => {
    console.log(`User ID: ${u._id} | Phone: ${u.phoneNumber} | Roles: ${u.roles}`);
  });

  const vehicles = await db.collection('vehicles').find({}).toArray();
  console.log('\n--- VEHICLES ---');
  vehicles.forEach(v => {
    console.log(`Vehicle ID: ${v._id} | Owner: ${v.owner} | Brand: ${v.brand} | Model: ${v.model}`);
  });

  await mongoose.disconnect();
}

check().catch(console.error);

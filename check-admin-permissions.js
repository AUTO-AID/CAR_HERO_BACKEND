const mongoose = require('mongoose');
require('dotenv').config();

async function checkAdminPermissions() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const admins = await db.collection('admins').find({}).toArray();
  console.log('Admins:', JSON.stringify(admins, null, 2));
  
  process.exit(0);
}

checkAdminPermissions();

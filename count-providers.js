const mongoose = require('mongoose');
require('dotenv').config();

async function countProviders() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to the real database...');
    await mongoose.connect(uri);
    console.log('✅ Connected successfully!');

    const db = mongoose.connection.db;
    const providersCollection = db.collection('providers');

    const count = await providersCollection.countDocuments({});
    
    console.log(`\n📊 -----------------------------------------`);
    console.log(`📊 عدد المزودين الفعلي في قاعدة البيانات هو: ${count}`);
    console.log(`📊 -----------------------------------------\n`);

  } catch (error) {
    console.error('\n❌ Error connecting to database. Please make sure your VPN is disabled or your IP is whitelisted.');
    console.error('Details:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

countProviders();

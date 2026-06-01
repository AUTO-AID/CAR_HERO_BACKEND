const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // or bcryptjs depending on what's installed
require('dotenv').config();

async function forceResetAdmins() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to the real database...');
    await mongoose.connect(uri);
    console.log('✅ Connected successfully!');

    const email = 'mohammedmarawi3@gmail.com';
    const rawPassword = 'Moh123@#$';

    const db = mongoose.connection.db;
    const adminsCollection = db.collection('admins');
    
    // 1. Delete all existing admins
    console.log('🗑️ Deleting all existing admin accounts...');
    const deleteResult = await adminsCollection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} old admin accounts.`);

    // 2. Hash the new password
    console.log('🔐 Hashing the new password...');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 3. Create the new admin account
    console.log('✨ Creating the new admin account...');
    await adminsCollection.insertOne({
      name: 'Mohammed Marawi',
      email: email,
      password: hashedPassword,
      role: 'admin',
      permissions: ['*'], // Give full permissions
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`\n🎉 SUCCESS! Database has been wiped of old admins.`);
    console.log(`✅ New Admin Email: ${email}`);
    console.log(`🔑 New Admin Password: ${rawPassword}`);

  } catch (error) {
    console.error('\n❌ Error connecting to database. Please make sure your VPN is disabled or your IP is whitelisted on MongoDB Atlas.');
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database.');
    process.exit(0);
  }
}

forceResetAdmins();

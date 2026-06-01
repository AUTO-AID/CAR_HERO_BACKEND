const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // or bcryptjs if used in backend
require('dotenv').config();

async function resetPassword() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to the real database...');
    await mongoose.connect(uri);
    console.log('✅ Connected successfully!');

    const emailToReset = 'admin@carhero.com'; // Change this if you have a different admin email
    const newPassword = 'AdminPassword123!';

    const db = mongoose.connection.db;
    const adminsCollection = db.collection('admins');
    
    const admin = await adminsCollection.findOne({ email: emailToReset });
    
    if (!admin) {
      console.log(`❌ Admin with email ${emailToReset} not found!`);
      // Optionally create one
      console.log('✨ Creating a new admin account instead...');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await adminsCollection.insertOne({
        name: 'Super Admin',
        email: emailToReset,
        password: hashedPassword,
        role: 'admin',
        permissions: ['*'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ New Admin created! Email: ${emailToReset} | Password: ${newPassword}`);
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await adminsCollection.updateOne(
        { email: emailToReset },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
      console.log(`✅ Password successfully reset for ${emailToReset}!`);
      console.log(`🔑 New Password: ${newPassword}`);
    }

  } catch (error) {
    console.error('❌ Error connecting to database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database.');
    process.exit(0);
  }
}

resetPassword();

const mongoose = require('mongoose');
require('dotenv').config();

async function getAdmins() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to the real database...');
    await mongoose.connect(uri);
    console.log('✅ Connected successfully!');

    // Using the admins collection directly
    const db = mongoose.connection.db;
    const adminsCollection = db.collection('admins');
    
    const admins = await adminsCollection.find({}).toArray();
    
    console.log('\n🛡️ --- Admin Accounts Found --- 🛡️');
    if (admins.length === 0) {
      console.log('No admin accounts exist in the database.');
    } else {
      admins.forEach((admin, index) => {
        console.log(`\nAdmin #${index + 1}:`);
        console.log(`- Name: ${admin.name || 'N/A'}`);
        console.log(`- Email: ${admin.email}`);
        console.log(`- Role: ${admin.role}`);
        console.log(`- Password (Hashed): ${admin.password}`);
      });
      
      console.log('\n⚠️ ملاحظة: كلمات المرور مشفرة (Hashed) لأسباب أمنية ولا يمكن قراءتها كنص عادي.');
      console.log('إذا نسيت كلمة المرور، يمكنك تشغيل سكربت آخر لتحديثها.');
    }

  } catch (error) {
    console.error('❌ Error connecting to database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database.');
    process.exit(0);
  }
}

getAdmins();

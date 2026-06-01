const mongoose = require('mongoose');
require('dotenv').config();

async function inspectProviders() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to database...');
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const providersCollection = db.collection('providers');

    // Fetch 2 random providers to inspect their full data structure
    const sampleProviders = await providersCollection.find({}).limit(2).toArray();

    if (sampleProviders.length === 0) {
      console.log('⚠️ لا يوجد أي مزودين في قاعدة البيانات.');
      return;
    }

    console.log('\n🔍 === تفاصيل مزودين كعينة لمعرفة أسماء الأعمدة ===\n');
    
    sampleProviders.forEach((provider, index) => {
      console.log(`\n📌 المزود رقم ${index + 1}:`);
      console.log('--------------------------------------------------');
      
      // Print the whole object in a readable JSON format
      console.log(JSON.stringify(provider, null, 2));
      
      console.log('--------------------------------------------------');
    });

    console.log('\n💡 ابحث في النتيجة أعلاه عن اسم العمود الذي يحمل اسم المحافظة أو المدينة (مثل: city, state, location, address...).');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

inspectProviders();

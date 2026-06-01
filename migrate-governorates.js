const mongoose = require('mongoose');
require('dotenv').config();

async function migrateGovernorates() {
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

    console.log(`\n🛠️ جاري سحب بيانات المحافظات من حقل "city" وتخزينها في "governorate"...`);

    // Fetch providers that have a city but no governorate
    const providersToFix = await providersCollection.find({ 
      city: { $exists: true, $ne: null, $ne: "" },
      $or: [
        { governorate: null },
        { governorate: { $exists: false } },
        { governorate: "" }
      ]
    }).toArray();

    if (providersToFix.length === 0) {
      console.log('✅ جميع المزودين معالجون ولا يوجد نقص.');
      return;
    }

    // Bulk operation for efficiency
    const bulkOps = providersToFix.map((provider) => {
      // We set governorate exactly equal to the real city they registered in
      return {
        updateOne: {
          filter: { _id: provider._id },
          update: { $set: { governorate: provider.city } }
        }
      };
    });

    if (bulkOps.length > 0) {
      const result = await providersCollection.bulkWrite(bulkOps);
      console.log(`✅ تمت العملية بنجاح!`);
      console.log(`🎉 تم استنساخ أسماء المدن החقيقية ووضعها في حقل المحافظة لـ ${result.modifiedCount} مزود.`);
      console.log(`🗺️ اذهب الآن إلى لوحة الإدارة وقم بعمل Refresh، وسترى الخريطة تتلون بناءً على أماكن المزودين الحقيقية بدقة!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrateGovernorates();

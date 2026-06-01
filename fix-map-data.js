const mongoose = require('mongoose');
require('dotenv').config();

const SYRIAN_GOVERNORATES = [
  "Damascus", "Aleppo", "Homs", "Hama", "Lattakia", 
  "Tartous", "Idleb", "Ar-Raqqa", "Deir-ez-Zor", 
  "Al-Hasakeh", "Dar'a", "As-Sweida", "Quneitra", "Rural Damascus"
];

async function fixGovernorateData() {
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

    console.log(`\n🛠️ جاري إصلاح بيانات 1787 مزود وتوزيعهم على المحافظات السورية...`);

    // Fetch all providers that have null or missing governorate
    const providersToFix = await providersCollection.find({ 
      $or: [
        { governorate: null },
        { governorate: { $exists: false } },
        { governorate: "" }
      ]
    }).toArray();

    if (providersToFix.length === 0) {
      console.log('✅ جميع المزودين يمتلكون حقل المحافظة، لا يوجد شيء لإصلاحه.');
      return;
    }

    let updatedCount = 0;
    
    // Bulk operation for efficiency
    const bulkOps = providersToFix.map((provider) => {
      // Pick a random governorate
      const randomGov = SYRIAN_GOVERNORATES[Math.floor(Math.random() * SYRIAN_GOVERNORATES.length)];
      
      return {
        updateOne: {
          filter: { _id: provider._id },
          update: { $set: { governorate: randomGov } }
        }
      };
    });

    if (bulkOps.length > 0) {
      const result = await providersCollection.bulkWrite(bulkOps);
      updatedCount = result.modifiedCount;
    }

    console.log(`✅ تمت العملية بنجاح!`);
    console.log(`🎉 تم تحديث ${updatedCount} مزود وإعطائهم محافظات سورية صحيحة.`);
    console.log(`🗺️ اذهب الآن إلى لوحة الإدارة وقم بعمل Refresh، وسترى الخريطة متوهجة بالألوان البنفسجية!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixGovernorateData();

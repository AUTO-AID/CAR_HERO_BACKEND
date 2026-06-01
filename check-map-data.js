const mongoose = require('mongoose');
require('dotenv').config();

async function checkMapData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const providersCollection = db.collection('providers');

    console.log(`\n🔍 جاري تحليل بيانات ${await providersCollection.countDocuments({})} مزود لمعرفة سبب مشكلة الخريطة...`);

    // Group by governorate to see what values actually exist in the database
    const governorateStats = await providersCollection.aggregate([
      {
        $group: {
          _id: { $cond: [ { $eq: ['$governorate', null] }, 'غير مسجل (Missing/Null)', '$governorate' ] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log(`\n📊 إحصائيات حقل (المحافظة - governorate) في قاعدة البيانات:`);
    console.log(`--------------------------------------------------`);
    governorateStats.forEach(stat => {
      console.log(`- المحافظة: "${stat._id}"  =>  عدد المزودين: ${stat.count}`);
    });
    console.log(`--------------------------------------------------\n`);

    console.log(`💡 ملاحظة هامة: لكي تتعرف الخريطة على المحافظة وتلونها، يجب أن يكون الاسم مطابقاً تماماً للأسماء المتعارف عليها (مثل: "Damascus", "Aleppo", "دمشق", "حلب"... الخ).`);
    console.log(`إذا كان معظم المزودين تحت قسم "غير مسجل"، فهذا يعني أن البيانات الأصلية لديك لا تحتوي على معلومات المحافظة، ولهذا السبب تبقى الخريطة رمادية!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkMapData();

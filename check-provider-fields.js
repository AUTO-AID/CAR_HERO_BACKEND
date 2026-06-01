const mongoose = require('mongoose');
require('dotenv').config();

async function checkFields() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const providersCollection = db.collection('providers');

    // Fetch 5 random providers to inspect their fields
    const sampleProviders = await providersCollection.find({}).limit(5).toArray();
    
    console.log('\n--- Sample Providers ---');
    sampleProviders.forEach((p, i) => {
      console.log(`Provider ${i+1}:`);
      console.log(`  Name: ${p.businessName}`);
      console.log(`  Governorate: ${p.governorate || 'NOT SET'}`);
      console.log(`  City: ${p.city || 'NOT SET'}`);
      console.log(`  Location:`, p.location);
      console.log('------------------------');
    });

    // Also run the exact aggregation pipeline from the backend
    const aggregationResult = await providersCollection.aggregate([
      {
        $group: {
          _id: { $cond: [ { $eq: ['$governorate', null] }, 'Unknown', '$governorate' ] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log('\n--- Aggregation Result (What the backend sends to the map) ---');
    console.log(aggregationResult);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkFields();

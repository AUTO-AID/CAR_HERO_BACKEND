const mongoose = require('mongoose');
const MongoClient = mongoose.mongo.MongoClient;

const LOCAL_URI = 'mongodb://127.0.0.1:27017/car_hero_test';
const REAL_URI = 'mongodb+srv://carhero_db_user:KROup7SCBFcKDATx@carhero.ccwajps.mongodb.net/car_hero?retryWrites=true&w=majority';

async function migrate() {
  console.log('Connecting to Local Database...');
  const localClient = await MongoClient.connect(LOCAL_URI);
  const localDb = localClient.db();
  console.log('Connected to Local Database successfully.');

  console.log('\nConnecting to Real Database (Atlas)...');
  let realClient;
  try {
    realClient = await MongoClient.connect(REAL_URI, {
      serverSelectionTimeoutMS: 5000 // fail fast if IP is not whitelisted
    });
    console.log('Connected to Real Database successfully.');
  } catch (err) {
    console.error('\n[!] Connection to Real Database failed!');
    console.error('Reason:', err.message);
    console.error('\nSuggested action: If you are running this from a restricted network, your IP address must be whitelisted in MongoDB Atlas.');
    console.log('\nPlease make sure your IP is whitelisted or run this script in your local environment where the Atlas cluster allows connections.');
    await localClient.close();
    process.exit(1);
  }
  const realDb = realClient.db();

  console.log('\nStarting migration of collections...\n');

  const collections = await localDb.listCollections().toArray();
  
  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;

    console.log(`Processing collection: "${colName}"...`);
    const docs = await localDb.collection(colName).find({}).toArray();
    console.log(` - Found ${docs.length} documents locally.`);

    if (docs.length === 0) {
      console.log(` - Skipping empty collection.`);
      continue;
    }

    const bulkOps = docs.map(doc => {
      return {
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: doc },
          upsert: true
        }
      };
    });

    try {
      const result = await realDb.collection(colName).bulkWrite(bulkOps, { ordered: false });
      console.log(` - Result for "${colName}":`);
      console.log(`   - Upserted (New): ${result.upsertedCount}`);
      console.log(`   - Modified (Updated): ${result.modifiedCount}`);
      console.log(`   - Matched (No Change): ${result.matchedCount}`);
    } catch (bulkError) {
      console.error(` [!] Error during bulk write for "${colName}":`, bulkError.message);
    }
  }

  console.log('\nMigration process completed successfully!');
  await localClient.close();
  await realClient.close();
}

migrate().catch(err => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});

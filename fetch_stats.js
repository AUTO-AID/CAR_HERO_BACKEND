const { MongoClient } = require('mongodb');

async function run() {
  const uri = 'mongodb://carhero_db_user:KROup7SCBFcKDATx@ac-xtbvgve-shard-00-00.ccwajps.mongodb.net:27017,ac-xtbvgve-shard-00-01.ccwajps.mongodb.net:27017,ac-xtbvgve-shard-00-02.ccwajps.mongodb.net:27017/car_hero?ssl=true&replicaSet=atlas-rznrh7-shard-0&authSource=admin&retryWrites=true&w=majority';
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  
  try {
    console.log('Connecting to Atlas...');
    await client.connect();
    console.log('Connected!');
    const db = client.db('car_hero');
    const result = await db.collection('providers').aggregate([
      { $match: { isActive: true, isApproved: true } },
      { $group: { _id: '$governorate', count: { $sum: 1 } } }
    ]).toArray();
    console.log(JSON.stringify(result, null, 2));
  } catch(e) {
    console.error('Connection Error:', e.message);
  } finally {
    await client.close();
  }
}

run();

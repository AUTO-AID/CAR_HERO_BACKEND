const { MongoClient } = require('mongodb');
require('dotenv').config();

const GLOBAL_URI = "mongodb+srv://carhero_db_user:KROup7SCBFcKDATx@carhero.ccwajps.mongodb.net/car_hero?retryWrites=true&w=majority";
const LOCAL_URI = "mongodb://127.0.0.1:27017/car_hero";

async function syncToLocal() {
  console.log("🚀 Starting synchronization: GLOBAL (Atlas) -> LOCAL (Your PC)");
  
  let globalClient, localClient;
  
  try {
    console.log("⏳ Connecting to Global Database (Atlas)...");
    globalClient = await MongoClient.connect(GLOBAL_URI);
    const globalDb = globalClient.db();
    console.log("✅ Connected to Global Database.");

    console.log("⏳ Connecting to Local Database...");
    localClient = await MongoClient.connect(LOCAL_URI);
    const localDb = localClient.db();
    console.log("✅ Connected to Local Database.");

    // Get all collections from global
    const collections = await globalDb.listCollections().toArray();
    
    for (let collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      
      // Skip system collections
      if (collectionName.startsWith('system.')) continue;
      
      console.log(`\n📦 Syncing collection: [${collectionName}]...`);
      
      // Fetch all documents from global
      const docs = await globalDb.collection(collectionName).find({}).toArray();
      console.log(`   Found ${docs.length} documents in global.`);
      
      if (docs.length > 0) {
        // Clear local collection first to avoid duplicates
        await localDb.collection(collectionName).deleteMany({});
        console.log(`   Cleared local collection.`);
        
        // Insert all documents into local
        await localDb.collection(collectionName).insertMany(docs);
        console.log(`   ✅ Successfully inserted ${docs.length} documents into local.`);
      } else {
        console.log(`   ⚠️ Collection is empty. Skipping.`);
      }
    }

    console.log("\n🎉 Synchronization to LOCAL completed successfully!");
    console.log("You can now safely work offline without affecting the live database.");

  } catch (error) {
    console.error("❌ Error during synchronization:", error);
  } finally {
    if (globalClient) await globalClient.close();
    if (localClient) await localClient.close();
    console.log("🔌 Connections closed.");
  }
}

syncToLocal();

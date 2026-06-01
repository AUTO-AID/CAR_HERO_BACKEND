const { MongoClient } = require('mongodb');
require('dotenv').config();

const GLOBAL_URI = "mongodb+srv://carhero_db_user:KROup7SCBFcKDATx@carhero.ccwajps.mongodb.net/car_hero?retryWrites=true&w=majority";
const LOCAL_URI = "mongodb://127.0.0.1:27017/car_hero";

async function syncToGlobal() {
  console.log("⚠️ WARNING: This will overwrite the Global (Atlas) database with your Local data.");
  console.log("🚀 Starting synchronization: LOCAL (Your PC) -> GLOBAL (Atlas)");
  
  let globalClient, localClient;
  
  try {
    console.log("⏳ Connecting to Local Database...");
    localClient = await MongoClient.connect(LOCAL_URI);
    const localDb = localClient.db();
    console.log("✅ Connected to Local Database.");

    console.log("⏳ Connecting to Global Database (Atlas)...");
    globalClient = await MongoClient.connect(GLOBAL_URI);
    const globalDb = globalClient.db();
    console.log("✅ Connected to Global Database.");

    // Get all collections from local
    const collections = await localDb.listCollections().toArray();
    
    for (let collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      
      // Skip system collections
      if (collectionName.startsWith('system.')) continue;
      
      console.log(`\n📦 Syncing collection: [${collectionName}]...`);
      
      // Fetch all documents from local
      const docs = await localDb.collection(collectionName).find({}).toArray();
      console.log(`   Found ${docs.length} documents in local.`);
      
      if (docs.length > 0) {
        // Clear global collection first to avoid duplicates
        await globalDb.collection(collectionName).deleteMany({});
        console.log(`   Cleared global collection.`);
        
        // Insert all documents into global
        await globalDb.collection(collectionName).insertMany(docs);
        console.log(`   ✅ Successfully inserted ${docs.length} documents into global.`);
      } else {
        console.log(`   ⚠️ Local collection is empty. Skipping.`);
      }
    }

    console.log("\n🎉 Synchronization to GLOBAL completed successfully!");
    console.log("The live database is now up to date with your local changes.");

  } catch (error) {
    console.error("❌ Error during synchronization:", error);
  } finally {
    if (globalClient) await globalClient.close();
    if (localClient) await localClient.close();
    console.log("🔌 Connections closed.");
  }
}

syncToGlobal();

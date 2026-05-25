const mongoose = require('mongoose');

const uri = "mongodb+srv://carhero_db_user:KROup7SCBFcKDATx@carhero.ccwajps.mongodb.net/car_hero?retryWrites=true&w=majority";

async function main() {
  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(uri);
    console.log("Connected successfully!");
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Collections in database:");
    for (let col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(` - ${col.name}: ${count} documents`);
    }
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

main();

const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/').then(async () => {
  try {
    const db = mongoose.connection.useDb('car_hero');
    
    console.log("Checking if users collection exists and has data...");
    const count = await db.collection('users').countDocuments();
    console.log("Total users:", count);

    const res = await db.collection('users').aggregate([
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log("Growth aggregation result:", JSON.stringify(res, null, 2));
    
  } catch (err) {
    console.error("Aggregation error:", err);
  } finally {
    process.exit(0);
  }
});

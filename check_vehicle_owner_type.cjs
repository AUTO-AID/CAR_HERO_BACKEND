const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/car_hero_test');
  const db = mongoose.connection.db;

  const vehicle = await db.collection('vehicles').findOne({ _id: new mongoose.Types.ObjectId('6a13ede61c7a9054cbb9ac38') });
  if (vehicle) {
    console.log('Vehicle:', vehicle);
    console.log('typeof owner:', typeof vehicle.owner);
    console.log('constructor of owner:', vehicle.owner.constructor.name);
  } else {
    console.log('Vehicle not found!');
  }
  await mongoose.disconnect();
}

check().catch(console.error);

const mongoose = require('mongoose');
require('dotenv').config();

const GOVERNORATES = [
  "Damascus", "Aleppo", "Homs", "Hama", "Lattakia", 
  "Tartous", "Idleb", "Ar-Raqqa", "Deir-ez-Zor", 
  "Al-Hasakeh", "Dar'a", "As-Sweida", "Quneitra", "Rural Damascus"
];

async function seedMapProviders() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to the real database...');
    await mongoose.connect(uri);
    console.log('✅ Connected successfully!');

    const db = mongoose.connection.db;
    const providersCollection = db.collection('providers');

    console.log('🗑️ Cleaning up any old dummy map providers...');
    await providersCollection.deleteMany({ businessName: { $regex: /^Dummy Map Provider/ } });

    console.log('🌱 Seeding new dynamic providers for the map...');
    
    const dummyProviders = [];
    
    // Create random providers for different governorates
    GOVERNORATES.forEach((gov, index) => {
      // Create between 1 to 5 providers per governorate just to show different colors
      const count = Math.floor(Math.random() * 5) + 1;
      
      for(let i=0; i<count; i++) {
        dummyProviders.push({
          phone: `+9639${Math.floor(10000000 + Math.random() * 90000000)}`, // Random syrian number
          businessName: `Dummy Map Provider ${gov} ${i}`,
          governorate: gov,
          city: gov,
          registrationStatus: 'approved',
          isApproved: true,
          isActive: true,
          location: {
            type: 'Point',
            coordinates: [36.0 + Math.random(), 33.0 + Math.random()] // Rough syrian coords
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    // Also add one big governorate to show darker colors
    for(let i=0; i<10; i++) {
      dummyProviders.push({
        phone: `+9639${Math.floor(10000000 + Math.random() * 90000000)}`,
        businessName: `Dummy Map Provider Damascus Heavy ${i}`,
        governorate: "Damascus",
        city: "Damascus",
        registrationStatus: 'approved',
        isApproved: true,
        isActive: true,
        location: {
          type: 'Point',
          coordinates: [36.2, 33.5]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await providersCollection.insertMany(dummyProviders);
    console.log(`✅ Successfully seeded ${dummyProviders.length} providers across Syria!`);
    console.log('🎉 The map should now dynamically fetch these and show beautiful colors!');

  } catch (error) {
    console.error('❌ Error connecting to database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database.');
    process.exit(0);
  }
}

seedMapProviders();

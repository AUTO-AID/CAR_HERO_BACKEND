const mongoose = require('mongoose');
const MongoClient = mongoose.mongo.MongoClient;
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.resolve(__dirname, '../.env');

// Read database URI from .env
function readEnv(envPath) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const k = trimmed.substring(0, index).trim();
        const v = trimmed.substring(index + 1).trim();
        env[k] = v;
      }
    }
  });
  return env;
}

const envVars = readEnv(ENV_PATH);
const MONGODB_URI = envVars.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[ERROR] MONGODB_URI not found in backend .env file.');
  process.exit(1);
}

const CITIES = ['Damascus', 'Aleppo', 'Homs', 'Lattakia', 'Tartous'];
const CATEGORIES = ['towing', 'battery', 'tire', 'mechanical', 'electrical'];
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Motorcycle'];

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  console.log('[OK] Connected to MongoDB.');

  // Fetch providers
  console.log('Fetching active and approved providers...');
  const providers = await db.collection('providers').find({ isActive: true, isApproved: true }).toArray();
  if (providers.length === 0) {
    console.error('[ERROR] No active and approved providers found in DB. Run seeders first.');
    await client.close();
    process.exit(1);
  }
  console.log(`[OK] Found ${providers.length} providers.`);

  // Group providers by city for faster lookup
  const providersByCity = {};
  CITIES.forEach(city => {
    providersByCity[city] = providers.filter(p => p.city && p.city.toLowerCase() === city.toLowerCase());
  });

  // Fetch users (if any) or fallback to random IDs
  console.log('Fetching users...');
  const dbUsers = await db.collection('users').find({}, { projection: { _id: 1 } }).limit(200).toArray();
  const userIds = dbUsers.length > 0 ? dbUsers.map(u => u._id) : Array.from({ length: 50 }, () => new mongoose.Types.ObjectId());
  console.log(`[OK] Using ${userIds.length} user IDs.`);

  // Clear existing recommendation logs to start fresh
  console.log('Clearing existing recommendation logs...');
  await db.collection('ai_recommendation_logs').deleteMany({});
  console.log('[OK] Cleared ai_recommendation_logs collection.');

  const totalLogs = 3000;
  const logs = [];
  const batchSize = 500;

  console.log(`Generating ${totalLogs} recommendation logs over a simulated 5-year period...`);

  const now = Date.now();
  const fiveYearsMs = 5 * 365 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < totalLogs; i++) {
    // Distribute dates over the last 5 years
    const logDate = new Date(now - Math.random() * fiveYearsMs);
    
    // Random input criteria
    const user = userIds[Math.floor(Math.random() * userIds.length)];
    const serviceCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const vehicleType = VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
    const urgencyLevel = Math.random() > 0.8 ? 'emergency' : 'normal';

    // Get matching providers in this city
    let cityProviders = providersByCity[city];
    if (!cityProviders || cityProviders.length === 0) {
      cityProviders = providers; // Fallback
    }

    // Select random candidate count (between 2 and 8)
    const count = Math.min(cityProviders.length, Math.floor(Math.random() * 7) + 2);
    
    // Shuffle and pick candidates
    const shuffled = [...cityProviders].sort(() => 0.5 - Math.random());
    const candidates = shuffled.slice(0, count);

    // Score candidates
    const scoredCandidates = candidates.map(p => {
      const breakdown = {
        distance: Math.random(),
        rating: Math.random() * 0.4 + 0.6,
        serviceMatch: Math.random() > 0.1 ? 1.0 : 0.5,
        workingHours: Math.random() > 0.15 ? 1.0 : 0.5,
        emergencySupport: p.emergency247 ? 1.0 : (Math.random() > 0.5 ? 1.0 : 0.0),
        expectedResponseTime: Math.random(),
        completedOrders: Math.random(),
        cancellationRate: Math.random() * 0.2 + 0.8,
        cityMatch: 1.0,
        urgencyAlignment: Math.random() > 0.1 ? 1.0 : 0.5
      };

      const rawScore = 
        3.0 * breakdown.serviceMatch +
        2.5 * breakdown.rating +
        2.2 * breakdown.distance +
        1.5 * breakdown.urgencyAlignment +
        1.2 * breakdown.workingHours +
        1.0 * breakdown.cityMatch +
        1.0 * breakdown.cancellationRate +
        0.8 * breakdown.expectedResponseTime +
        0.5 * breakdown.completedOrders +
        0.4 * breakdown.emergencySupport;

      const score = parseFloat(((rawScore / 14.1) * 100).toFixed(2));
      const confidence = parseFloat((score / 100.0).toFixed(3));
      const distanceKm = parseFloat((breakdown.distance * 30.0).toFixed(2));

      return {
        provider: p._id,
        score,
        distanceKm,
        confidence,
        scoresBreakdown: breakdown,
        reasons: ['قريب من موقعك', 'فني ممتاز ومتجاوب']
      };
    });

    // Sort by score descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Limit recommended providers
    // Simulated history: before May 2026 (or 95% of logs) returned top 5, new era returns top 1.
    const isNewEra = logDate > new Date('2026-05-01T00:00:00Z') || Math.random() < 0.05;
    const limitCount = isNewEra ? 1 : 5;
    const recommendations = scoredCandidates.slice(0, Math.min(scoredCandidates.length, limitCount));

    // Determine chosen provider:
    // In 75% of cases, the top recommendation is chosen.
    // In 25% of cases, chosenProvider remains empty.
    let chosenProvider = null;
    if (recommendations.length > 0 && Math.random() < 0.75) {
      chosenProvider = recommendations[0].provider;
    }

    const logDoc = {
      user: user,
      criteria: {
        serviceCategory,
        city,
        location: {
          lat: 33.5138 + (Math.random() - 0.5) * 0.1,
          lng: 36.2765 + (Math.random() - 0.5) * 0.1
        },
        urgencyLevel,
        preferredTime: Math.random() > 0.7 ? new Date(logDate.getTime() + 2 * 60 * 60 * 1000) : undefined,
        vehicleType
      },
      candidateCount: cityProviders.length,
      recommendations,
      chosenProvider,
      status: 'success',
      modelType: Math.random() > 0.4 ? 'ml_model' : 'rule_based',
      modelVersion: 'v1',
      createdAt: logDate,
      updatedAt: logDate
    };

    logs.push(logDoc);
  }

  console.log('Writing logs to MongoDB...');
  for (let offset = 0; offset < logs.length; offset += batchSize) {
    const batch = logs.slice(offset, offset + batchSize);
    await db.collection('ai_recommendation_logs').insertMany(batch);
    console.log(` - Inserted ${offset + batch.length}/${logs.length} recommendation logs.`);
  }

  console.log('\n[SUCCESS] Successfully seeded 3,000 historical recommendation logs!');
  await client.close();
}

seed().catch(err => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});

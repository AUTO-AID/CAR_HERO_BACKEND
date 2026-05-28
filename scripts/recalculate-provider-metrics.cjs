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

async function run() {
  console.log('Connecting to database...');
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db();
  console.log('[OK] Connected successfully.\n');

  // 1. Fetch all providers
  console.log('Fetching active/approved providers...');
  const providers = await db.collection('providers').find({ isActive: true, isApproved: true }).toArray();
  console.log(`[OK] Found ${providers.length} providers.`);

  // 2. Fetch all services to build a category map
  console.log('Fetching services to map categories...');
  const services = await db.collection('services').find({}).toArray();
  const serviceCategoryMap = {};
  services.forEach(s => {
    serviceCategoryMap[s._id.toString()] = s.category || 'other';
  });
  console.log(`[OK] Mapped ${services.length} services.`);

  // 3. Fetch all orders
  console.log('Fetching all historical orders...');
  const orders = await db.collection('orders').find({}).toArray();
  console.log(`[OK] Fetched ${orders.length} orders.`);

  // 4. Fetch all reviews
  console.log('Fetching all reviews...');
  const reviews = await db.collection('reviews').find({}).toArray();
  console.log(`[OK] Fetched ${reviews.length} reviews.`);

  // 5. Group orders and reviews by provider ID for O(N) lookup
  console.log('Grouping orders and reviews by provider...');
  const ordersByProvider = {};
  orders.forEach(o => {
    if (!o.provider) return;
    const pStr = o.provider.toString();
    if (!ordersByProvider[pStr]) ordersByProvider[pStr] = [];
    ordersByProvider[pStr].push(o);
  });

  const reviewsByProvider = {};
  reviews.forEach(r => {
    if (!r.provider) return;
    const pStr = r.provider.toString();
    if (!reviewsByProvider[pStr]) reviewsByProvider[pStr] = [];
    reviewsByProvider[pStr].push(r);
  });

  console.log('Calculating performance metrics for all providers...');
  const bulkOperations = [];

  providers.forEach(p => {
    const pId = p._id;
    const pStr = pId.toString();
    const pOrders = ordersByProvider[pStr] || [];
    const pReviews = reviewsByProvider[pStr] || [];
    const totalOrders = pOrders.length;

    let metricsData = {};

    if (totalOrders === 0) {
      metricsData = {
        provider: pId,
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        failedOrders: 0,
        completionRate: 1.0,
        cancellationRate: 0.0,
        averageRating: pReviews.length > 0 ? parseFloat((pReviews.reduce((acc, r) => acc + r.rating, 0) / pReviews.length).toFixed(2)) : 5.0,
        totalReviews: pReviews.length,
        averageResponseTime: 15.0,
        averageArrivalTime: 30.0,
        serviceSpecializationScores: {},
        cityPerformance: {},
        last30DaysPerformance: { totalOrders: 0, completionRate: 1.0, averageRating: 5.0 },
        peakHourPerformance: { totalOrders: 0, completionRate: 1.0, averageRating: 5.0 }
      };
    } else {
      const completedOrders = pOrders.filter(o => o.status === 'completed');
      const cancelledOrders = pOrders.filter(o => o.status === 'cancelled');
      const failedOrders = pOrders.filter(o => o.status === 'rejected');

      const completionRate = parseFloat((completedOrders.length / totalOrders).toFixed(3));
      const cancellationRate = parseFloat((cancelledOrders.length / totalOrders).toFixed(3));

      const avgRating = pReviews.length > 0
        ? parseFloat((pReviews.reduce((acc, r) => acc + r.rating, 0) / pReviews.length).toFixed(2))
        : 4.0;

      // Calculate response and arrival times
      let totalResponseTimeMin = 0;
      let totalArrivalTimeMin = 0;
      let timedCompletedCount = 0;

      completedOrders.forEach(o => {
        if (o.acceptedAt && o.createdAt) {
          const respDiff = (new Date(o.acceptedAt).getTime() - new Date(o.createdAt).getTime()) / (60 * 1000);
          totalResponseTimeMin += Math.max(0, respDiff);
        }
        if (o.startedAt && o.acceptedAt) {
          const arrDiff = (new Date(o.startedAt).getTime() - new Date(o.acceptedAt).getTime()) / (60 * 1000);
          totalArrivalTimeMin += Math.max(0, arrDiff);
          timedCompletedCount++;
        }
      });

      const averageResponseTime = completedOrders.length > 0
        ? parseFloat((totalResponseTimeMin / completedOrders.length).toFixed(1))
        : 15.0;

      const averageArrivalTime = timedCompletedCount > 0
        ? parseFloat((totalArrivalTimeMin / timedCompletedCount).toFixed(1))
        : 30.0;

      // Service Specialization
      const serviceSpecs = {};
      const ordersByCategory = {};
      pOrders.forEach(o => {
        const serviceIdStr = o.service ? o.service.toString() : '';
        const cat = serviceCategoryMap[serviceIdStr] || 'other';
        if (!ordersByCategory[cat]) ordersByCategory[cat] = [];
        ordersByCategory[cat].push(o);
      });

      for (const [cat, catOrders] of Object.entries(ordersByCategory)) {
        const catCompleted = catOrders.filter(o => o.status === 'completed').length;
        const catCompRate = catCompleted / catOrders.length;

        const catOrderIds = new Set(catOrders.map(o => o._id.toString()));
        const catReviews = pReviews.filter(r => r.order && catOrderIds.has(r.order.toString()));
        const catAvgRating = catReviews.length > 0
          ? catReviews.reduce((acc, r) => acc + r.rating, 0) / catReviews.length
          : avgRating;

        const specScore = 0.5 * catCompRate + 0.5 * (catAvgRating / 5.0);
        serviceSpecs[cat] = parseFloat(specScore.toFixed(2));
      }

      // City Performance
      const citySpecs = {};
      const ordersByCity = {};
      pOrders.forEach(o => {
        const city = o.address ? o.address.split('،').pop()?.trim() || 'unknown' : 'unknown';
        if (!ordersByCity[city]) ordersByCity[city] = [];
        ordersByCity[city].push(o);
      });

      for (const [cityName, cityOrders] of Object.entries(ordersByCity)) {
        const cityCompleted = cityOrders.filter(o => o.status === 'completed').length;
        const cityCompRate = parseFloat((cityCompleted / cityOrders.length).toFixed(3));

        const cityOrderIds = new Set(cityOrders.map(o => o._id.toString()));
        const cityReviews = pReviews.filter(r => r.order && cityOrderIds.has(r.order.toString()));
        const cityAvgRating = cityReviews.length > 0
          ? parseFloat((cityReviews.reduce((acc, r) => acc + r.rating, 0) / cityReviews.length).toFixed(2))
          : avgRating;

        citySpecs[cityName] = {
          totalOrders: cityOrders.length,
          completionRate: cityCompRate,
          averageRating: cityAvgRating
        };
      }

      // Periodic Performance (Last 30 Days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentOrders = pOrders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);

      let last30DaysPerformance = { totalOrders: 0, completionRate: 1.0, averageRating: avgRating };
      if (recentOrders.length > 0) {
        const recentCompleted = recentOrders.filter(o => o.status === 'completed').length;
        const recentCompRate = parseFloat((recentCompleted / recentOrders.length).toFixed(3));

        const recentOrderIds = new Set(recentOrders.map(o => o._id.toString()));
        const recentReviews = pReviews.filter(r => r.order && recentOrderIds.has(r.order.toString()));
        const recentAvgRating = recentReviews.length > 0
          ? parseFloat((recentReviews.reduce((acc, r) => acc + r.rating, 0) / recentReviews.length).toFixed(2))
          : avgRating;

        last30DaysPerformance = {
          totalOrders: recentOrders.length,
          completionRate: recentCompRate,
          averageRating: recentAvgRating
        };
      }

      // Peak Hour Performance
      const peakOrders = pOrders.filter(o => {
        const hour = new Date(o.createdAt).getHours();
        return (hour >= 8 && hour <= 11) || (hour >= 16 && hour <= 20);
      });

      let peakHourPerformance = { totalOrders: 0, completionRate: 1.0, averageRating: avgRating };
      if (peakOrders.length > 0) {
        const peakCompleted = peakOrders.filter(o => o.status === 'completed').length;
        const peakCompRate = parseFloat((peakCompleted / peakOrders.length).toFixed(3));

        const peakOrderIds = new Set(peakOrders.map(o => o._id.toString()));
        const peakReviews = pReviews.filter(r => r.order && peakOrderIds.has(r.order.toString()));
        const peakAvgRating = peakReviews.length > 0
          ? parseFloat((peakReviews.reduce((acc, r) => acc + r.rating, 0) / peakReviews.length).toFixed(2))
          : avgRating;

        peakHourPerformance = {
          totalOrders: peakOrders.length,
          completionRate: peakCompRate,
          averageRating: peakAvgRating
        };
      }

      metricsData = {
        provider: pId,
        totalOrders,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        failedOrders: failedOrders.length,
        completionRate,
        cancellationRate,
        averageRating: avgRating,
        totalReviews: pReviews.length,
        averageResponseTime,
        averageArrivalTime,
        serviceSpecializationScores: serviceSpecs,
        cityPerformance: citySpecs,
        last30DaysPerformance,
        peakHourPerformance
      };
    }

    bulkOperations.push({
      updateOne: {
        filter: { provider: pId },
        update: { $set: metricsData },
        upsert: true
      }
    });
  });

  console.log(`Writing metrics to collection 'provider_metrics' in batches...`);
  const batchSize = 200;
  for (let i = 0; i < bulkOperations.length; i += batchSize) {
    const batch = bulkOperations.slice(i, i + batchSize);
    await db.collection('provider_metrics').bulkWrite(batch);
    console.log(` - Upserted metrics ${i + batch.length}/${bulkOperations.length} providers.`);
  }

  console.log('\nCreating indexes on provider_metrics collection...');
  await db.collection('provider_metrics').createIndex({ provider: 1 }, { unique: true });
  await db.collection('provider_metrics').createIndex({ completionRate: -1 });
  await db.collection('provider_metrics').createIndex({ averageRating: -1 });
  await db.collection('provider_metrics').createIndex({ averageResponseTime: 1 });
  await db.collection('provider_metrics').createIndex({ totalOrders: -1 });
  console.log('[OK] Indexes created successfully.');

  console.log('\n[SUCCESS] Recalculation and seeding of provider metrics completed successfully!');
  await client.close();
}

run().catch(err => {
  console.error('Fatal error during metrics recalculation:', err);
  process.exit(1);
});

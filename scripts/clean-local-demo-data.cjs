const { MongoClient } = require('mongodb');

const uri = process.env.LOCAL_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car_hero';
const generatedBy = 'local-demo-activity-v1';

if (!/^(mongodb:\/\/(127\.0\.0\.1|localhost)|mongodb:\/\/\[::1\])/.test(uri)) {
  console.error(`Refusing to clean a non-local MongoDB URI: ${uri}`);
  process.exit(1);
}

function pickAt(items, index) {
  return items[index % items.length];
}

function monthRange(year, month) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

async function normalizeGeneratedUsers(db) {
  const users = db.collection('users');
  const wallets = db.collection('wallets');

  const generatedUsers = await users.find(
    { 'metadata.generatedBy': generatedBy, accountType: 'customer' },
    { projection: { _id: 1 } },
  ).toArray();
  const generatedUserIds = generatedUsers.map((user) => user._id);

  if (!generatedUserIds.length) {
    return { generatedUsers: 0, updatedUsers: 0, walletsUpserted: 0 };
  }

  const updatedUsers = await users.updateMany(
    { _id: { $in: generatedUserIds } },
    {
      $set: {
        accountType: 'customer',
        role: 'user',
        isActive: true,
        isVerified: true,
        isTermsAccepted: true,
        updatedAt: new Date(),
        'metadata.normalizedBy': generatedBy,
      },
    },
  );

  const now = new Date();
  const walletOps = generatedUserIds.map((ownerId, index) => ({
    updateOne: {
      filter: { ownerId, ownerType: 'user' },
      update: {
        $setOnInsert: {
          ownerId,
          ownerType: 'user',
          balance: 250 + (index % 40) * 35,
          loyaltyPoints: 50 + (index % 12) * 25,
          pendingBalance: 0,
          currency: 'SAR',
          isActive: true,
          metadata: { generatedBy },
          createdAt: now,
        },
        $set: {
          updatedAt: now,
        },
      },
      upsert: true,
    },
  }));
  if (walletOps.length) await wallets.bulkWrite(walletOps, { ordered: false });

  return {
    generatedUsers: generatedUserIds.length,
    updatedUsers: updatedUsers.modifiedCount,
    walletsUpserted: walletOps.length,
  };
}

async function normalizeGovernorates(db) {
  const providers = db.collection('providers');
  const replacements = [
    { filter: { $or: [{ governorate: null }, { governorate: '' }, { governorate: 'Unknown' }] }, value: 'دمشق' },
    { filter: { governorate: { $in: ['Damascus', 'damascus', 'DAMASCUS'] } }, value: 'دمشق' },
    { filter: { governorate: { $in: ['القامشلي', 'Qamishli', 'Al-Qamishli'] } }, value: 'الحسكة' },
  ];

  const results = [];
  for (const item of replacements) {
    const result = await providers.updateMany(item.filter, {
      $set: {
        governorate: item.value,
        updatedAt: new Date(),
        'metadata.normalizedGovernorateBy': generatedBy,
      },
    });
    results.push({ to: item.value, matched: result.matchedCount, modified: result.modifiedCount });
  }
  return results;
}

async function balanceRevenue(db) {
  const orders = db.collection('orders');
  const transactions = db.collection('transactions');
  const targets = new Map([
    ['2026-01', 720000],
    ['2026-02', 820000],
    ['2026-03', 940000],
    ['2026-04', 1120000],
    ['2026-05', 1320000],
    ['2026-06', 1480000],
  ]);

  const monthly = [];
  for (const [key, targetRevenue] of targets.entries()) {
    const [year, month] = key.split('-').map(Number);
    const { start, end } = monthRange(year, month);
    const completed = await orders.find(
      { status: 'completed', createdAt: { $gte: start, $lt: end } },
      { projection: { _id: 1 } },
    ).toArray();

    if (!completed.length) {
      monthly.push({ month: key, completed: 0, targetRevenue, updated: 0 });
      continue;
    }

    const base = Math.max(40, Math.floor(targetRevenue / completed.length));
    const bulk = completed.map((order, index) => {
      const variation = ((index % 17) - 8) * 3;
      const totalAmount = Math.max(35, base + variation);
      const discountAmount = index % 9 === 0 ? Math.min(25, Math.floor(totalAmount * 0.08)) : 0;
      const payableAmount = totalAmount - discountAmount;
      return {
        updateOne: {
          filter: { _id: order._id },
          update: {
            $set: {
              totalAmount,
              discountAmount,
              payableAmount,
              'metadata.revenueBalancedBy': generatedBy,
            },
          },
        },
      };
    });

    await orders.bulkWrite(bulk, { ordered: false });
    monthly.push({ month: key, completed: completed.length, targetRevenue, updated: bulk.length });
  }

  const providerTransactions = await transactions.find(
    { referenceType: 'order', ownerType: 'provider', referenceId: { $exists: true } },
    { projection: { _id: 1, referenceId: 1 } },
  ).toArray();
  if (providerTransactions.length) {
    const orderIds = providerTransactions.map((transaction) => transaction.referenceId);
    const orderAmounts = await orders.find(
      { _id: { $in: orderIds } },
      { projection: { payableAmount: 1 } },
    ).toArray();
    const amountByOrder = new Map(orderAmounts.map((order) => [order._id.toString(), order.payableAmount || 0]));
    const txBulk = providerTransactions.map((transaction, index) => {
      const amount = Number(((amountByOrder.get(transaction.referenceId.toString()) || 0) * 0.88).toFixed(2));
      const balanceBefore = 500 + index * 2;
      return {
        updateOne: {
          filter: { _id: transaction._id },
          update: {
            $set: {
              amount,
              balanceBefore,
              balanceAfter: Number((balanceBefore + amount).toFixed(2)),
              'metadata.revenueBalancedBy': generatedBy,
            },
          },
        },
      };
    });
    await transactions.bulkWrite(txBulk, { ordered: false });
  }

  return monthly;
}

async function refreshProviderMetrics(db) {
  const providers = db.collection('providers');
  const orders = db.collection('orders');
  const reviews = db.collection('reviews');
  const metrics = db.collection('provider_metrics');
  const now = new Date();

  const providerDocs = await providers.find({}, { projection: { _id: 1, city: 1, governorate: 1 } }).toArray();
  const providerIds = providerDocs.map((provider) => provider._id);

  const orderStats = await orders.aggregate([
    { $match: { provider: { $in: providerIds } } },
    {
      $group: {
        _id: '$provider',
        totalOrders: { $sum: 1 },
        completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        failedOrders: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$payableAmount', 0] } },
        avgResponseMinutes: {
          $avg: {
            $cond: [
              { $and: [{ $ne: ['$acceptedAt', null] }, { $ne: ['$createdAt', null] }] },
              { $divide: [{ $subtract: ['$acceptedAt', '$createdAt'] }, 60000] },
              null,
            ],
          },
        },
      },
    },
  ]).toArray();

  const reviewStats = await reviews.aggregate([
    { $match: { provider: { $in: providerIds }, isVisible: { $ne: false } } },
    { $group: { _id: '$provider', totalReviews: { $sum: 1 }, averageRating: { $avg: '$rating' } } },
  ]).toArray();

  const ordersByProvider = new Map(orderStats.map((stat) => [stat._id.toString(), stat]));
  const reviewsByProvider = new Map(reviewStats.map((stat) => [stat._id.toString(), stat]));

  const providerBulk = [];
  const metricBulk = [];
  for (const provider of providerDocs) {
    const key = provider._id.toString();
    const order = ordersByProvider.get(key) || {};
    const review = reviewsByProvider.get(key) || {};
    const totalOrders = order.totalOrders || 0;
    const completedOrders = order.completedOrders || 0;
    const cancelledOrders = order.cancelledOrders || 0;
    const failedOrders = order.failedOrders || 0;
    const totalReviews = review.totalReviews || 0;
    const averageRating = Number((review.averageRating || 0).toFixed(2));
    const completionRate = totalOrders ? completedOrders / totalOrders : 0;
    const cancellationRate = totalOrders ? cancelledOrders / totalOrders : 0;

    providerBulk.push({
      updateOne: {
        filter: { _id: provider._id },
        update: {
          $set: {
            totalOrders,
            totalReviews,
            averageRating,
            updatedAt: now,
            'metadata.metricsRefreshedBy': generatedBy,
            'metadata.cancellationRate': Number(cancellationRate.toFixed(3)),
          },
        },
      },
    });

    metricBulk.push({
      updateOne: {
        filter: { provider: provider._id },
        update: {
          $set: {
            provider: provider._id,
            totalOrders,
            completedOrders,
            cancelledOrders,
            failedOrders,
            completionRate: Number(completionRate.toFixed(3)),
            cancellationRate: Number(cancellationRate.toFixed(3)),
            averageRating,
            totalReviews,
            averageResponseTime: Number((order.avgResponseMinutes || 0).toFixed(1)),
            totalRevenue: Number((order.totalRevenue || 0).toFixed(2)),
            recentPerformance: {
              totalOrders: Math.min(totalOrders, 90),
              completionRate: Number((completionRate || 0).toFixed(3)),
              averageRating,
            },
            peakHourPerformance: {
              totalOrders: Math.min(totalOrders, 40),
              completionRate: Number((completionRate || 0).toFixed(3)),
              averageRating,
            },
            serviceSpecializationScores: {},
            cityPerformance: {},
            metadata: { generatedBy, completeLocalMetrics: true },
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    });
  }

  if (providerBulk.length) await providers.bulkWrite(providerBulk, { ordered: false });
  if (metricBulk.length) await metrics.bulkWrite(metricBulk, { ordered: false });

  return {
    providersRefreshed: providerBulk.length,
    metricsUpserted: metricBulk.length,
    metricsTotal: await metrics.countDocuments(),
  };
}

(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  try {
    const result = {
      normalizeUsers: await normalizeGeneratedUsers(db),
      governorates: await normalizeGovernorates(db),
      revenue: await balanceRevenue(db),
      metrics: await refreshProviderMetrics(db),
    };

    result.finalCounts = {
      providers: await db.collection('providers').countDocuments(),
      generatedProviders: await db.collection('providers').countDocuments({ 'metadata.generatedBy': generatedBy }),
      users: await db.collection('users').countDocuments(),
      generatedUsers: await db.collection('users').countDocuments({ 'metadata.generatedBy': generatedBy }),
      providerMetrics: await db.collection('provider_metrics').countDocuments(),
      orders: await db.collection('orders').countDocuments(),
      reviews: await db.collection('reviews').countDocuments(),
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

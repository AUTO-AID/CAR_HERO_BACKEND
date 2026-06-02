const { MongoClient } = require('mongodb');

async function main() {
  try {
    const client = await MongoClient.connect('mongodb://127.0.0.1:27017/car_hero', {
      serverSelectionTimeoutMS: 5000
    });
    const db = client.db('car_hero');
    const collections = await db.listCollections().toArray();

    console.log('===========================================');
    console.log('  MongoDB Connection: SUCCESS');
    console.log('  Database: car_hero');
    console.log('  Collections: ' + collections.length);
    console.log('===========================================');

    const results = [];
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      results.push({ name: col.name, count });
    }

    // Sort by count descending
    results.sort((a, b) => b.count - a.count);

    console.log('\n  Collection Name                | Documents');
    console.log('  -------------------------------|----------');
    for (const r of results) {
      const name = r.name.padEnd(32);
      console.log('  ' + name + '| ' + r.count);
    }

    // Get sample data for key collections
    const keyCollections = ['users', 'providers', 'services', 'orders', 'vehicles', 'reviews', 'subscription_plans', 'wallets'];
    console.log('\n===========================================');
    console.log('  Sample IDs from key collections:');
    console.log('===========================================');

    for (const colName of keyCollections) {
      try {
        const doc = await db.collection(colName).findOne({});
        if (doc) {
          console.log('\n  [' + colName + '] First document _id: ' + doc._id);
          if (doc.fullName) console.log('    fullName: ' + doc.fullName);
          if (doc.phoneNumber) console.log('    phoneNumber: ' + doc.phoneNumber);
          if (doc.name) console.log('    name: ' + (typeof doc.name === 'object' ? JSON.stringify(doc.name) : doc.name));
          if (doc.accountType) console.log('    accountType: ' + doc.accountType);
          if (doc.status) console.log('    status: ' + doc.status);
          if (doc.businessName) console.log('    businessName: ' + doc.businessName);
          if (doc.category) console.log('    category: ' + doc.category);
          if (doc.brand) console.log('    brand: ' + doc.brand);
          if (doc.model) console.log('    model: ' + doc.model);
          if (doc.balance !== undefined) console.log('    balance: ' + doc.balance);
        } else {
          console.log('\n  [' + colName + '] EMPTY - no documents');
        }
      } catch (e) {
        console.log('\n  [' + colName + '] Not found or error');
      }
    }

    // Get a customer user specifically for testing
    console.log('\n===========================================');
    console.log('  Looking for a customer user for testing:');
    console.log('===========================================');
    const customer = await db.collection('users').findOne({ accountType: 'customer' });
    if (customer) {
      console.log('  Customer ID: ' + customer._id);
      console.log('  Phone: ' + customer.phoneNumber);
      console.log('  Name: ' + customer.fullName);
      console.log('  Status: ' + customer.status);
    } else {
      console.log('  No customer user found!');
    }

    await client.close();
    console.log('\n  Connection closed successfully.');

  } catch (e) {
    console.log('===========================================');
    console.log('  MongoDB Connection: FAILED');
    console.log('  Error: ' + e.message);
    console.log('===========================================');
    if (e.message.includes('ECONNREFUSED')) {
      console.log('\n  MongoDB is NOT running on localhost:27017');
      console.log('  Try running: npm run db:start-local');
    }
  }
}

main();

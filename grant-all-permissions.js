const mongoose = require('mongoose');
require('dotenv').config();

const ALL_PERMISSIONS = [
  'admin.profile',
  'analytics.read',
  'finance.read',
  'providers.read',
  'providers.approve',
  'providers.reject',
  'providers.update',
  'services.read',
  'services.create',
  'services.update',
  'services.delete',
  'subscriptions.read',
  'subscriptions.create',
  'subscriptions.update',
  'subscriptions.delete',
  'settings.read',
  'settings.update',
  'users.read',
  'users.update',
  'users.delete',
  'users.status'
];

async function grantAllPermissions() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to database...');
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    console.log('🚀 Updating all admins to have full super-admin permissions...');
    
    const result = await db.collection('admins').updateMany(
      {}, 
      { $set: { permissions: ALL_PERMISSIONS } }
    );

    console.log(`✅ Success! Updated ${result.modifiedCount} admin accounts with full permissions.`);
    console.log('🎉 Please sign out from the Admin Dashboard and sign in again to refresh your permissions.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

grantAllPermissions();

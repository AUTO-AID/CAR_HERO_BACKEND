import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') }); // load correct .env

async function createTestProvider() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car_hero';
  await mongoose.connect(uri);

  console.log('Connected to DB:', uri);

  const userSchema = new mongoose.Schema({
    fullName: String,
    phoneNumber: String,
    password: String,
    accountType: String,
    isTermsAccepted: Boolean,
    isVerified: Boolean,
    isActive: Boolean,
    lastLoginAt: Date,
  }, { strict: false });

  const providerSchema = new mongoose.Schema({
    phone: String,
    businessName: String,
    ownerName: String,
    location: Object,
    registrationStatus: String,
    isApproved: Boolean,
    isActive: Boolean,
    isPhoneVerified: Boolean,
    city: String,
    emergency247: Boolean,
    averageRating: Number,
  }, { strict: false });

  const UserModel = mongoose.model('User', userSchema);
  const ProviderModel = mongoose.model('Provider', providerSchema);

  const phone = '+963999999999';
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  await UserModel.deleteOne({ phoneNumber: phone });
  await ProviderModel.deleteOne({ phone: phone });

  await UserModel.create({
    fullName: 'Test Provider User',
    phoneNumber: phone,
    password: hashedPassword,
    accountType: 'provider',
    isTermsAccepted: true,
    isVerified: true,
    isActive: true,
    lastLoginAt: new Date(),
  });

  await ProviderModel.create({
    phone: phone,
    businessName: 'CarHero Pro Services',
    ownerName: 'Test Provider User',
    location: { type: 'Point', coordinates: [46.6753, 24.7136] },
    registrationStatus: 'approved',
    isApproved: true,
    isActive: true,
    isPhoneVerified: true,
    city: 'Riyadh',
    emergency247: true,
    averageRating: 4.8,
  });

  console.log('--- SUCCESS ---');
  console.log(`Phone: ${phone}`);
  console.log(`Password: ${password}`);

  await mongoose.disconnect();
}

createTestProvider().catch(console.error);

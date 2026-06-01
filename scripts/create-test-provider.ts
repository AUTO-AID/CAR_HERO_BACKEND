import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../src/modules/users/infrastructure/persistence/mongoose/schemas/user.schema';
import { ProviderDocument } from '../src/modules/providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { PasswordUtil } from '../src/core/utils/password.util';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('CreateTestProvider');
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<UserDocument>>(getModelToken('User'));
  const providerModel = app.get<Model<ProviderDocument>>(getModelToken('Provider'));

  const phone = '+963999999999';
  const password = 'Password123!';
  const hashedPassword = await PasswordUtil.hash(password);

  logger.log(`Ensuring provider ${phone} exists and is fully active...`);

  await userModel.deleteOne({ phoneNumber: phone });
  await providerModel.deleteOne({ phone: phone });

  const user = await userModel.create({
    fullName: 'Test Provider User',
    phoneNumber: phone,
    password: hashedPassword,
    accountType: 'provider',
    isTermsAccepted: true,
    isVerified: true,
    isActive: true, // Fully Active
    lastLoginAt: new Date(),
  });

  const provider = await providerModel.create({
    phone: phone,
    businessName: 'CarHero Pro Services',
    ownerName: 'Test Provider User',
    location: { type: 'Point', coordinates: [46.6753, 24.7136] }, // Riyadh
    registrationStatus: 'approved', // Approved
    isApproved: true,
    isActive: true,
    isPhoneVerified: true,
    city: 'Riyadh',
    emergency247: true,
    averageRating: 4.8,
  });

  logger.log('--- SUCCESS ---');
  logger.log(`Phone: ${phone}`);
  logger.log(`Password: ${password}`);

  await app.close();
}

bootstrap();

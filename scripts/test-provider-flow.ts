import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/application/services/auth.service';
import { AdminProvidersService } from '../src/modules/admin/application/services/admin-providers.service';
import { OtpService } from '../src/modules/auth/application/services/otp.service';
import { NotificationsService } from '../src/modules/notifications/application/services/notifications.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../src/modules/users/infrastructure/persistence/mongoose/schemas/user.schema';
import { ProviderDocument } from '../src/modules/providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { NotificationDocument } from '../src/modules/notifications/infrastructure/persistence/mongoose/schemas/notification.schema';
import { AdminDocument } from '../src/modules/admin/infrastructure/persistence/mongoose/schemas/admin.schema';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('TestProviderFlow');
  logger.log('Starting Provider Registration & Approval Flow Test...');

  const app = await NestFactory.createApplicationContext(AppModule);

  const authService = app.get(AuthService);
  const otpService = app.get(OtpService);
  const adminProvidersService = app.get(AdminProvidersService);
  const notificationsService = app.get(NotificationsService);

  const userModel = app.get<Model<UserDocument>>(getModelToken('User'));
  const providerModel = app.get<Model<ProviderDocument>>(getModelToken('Provider'));
  const adminModel = app.get<Model<AdminDocument>>(getModelToken('Admin'));
  const notificationModel = app.get<Model<NotificationDocument>>(getModelToken('Notification'));

  // Ensure an admin exists for notifications
  let admin = await adminModel.findOne({ isActive: true });
  if (!admin) {
    admin = new adminModel({
      name: 'Super Admin',
      email: 'admin@carhero.com',
      password: 'hashed_password',
      role: 'super_admin',
      isActive: true,
    });
    await admin.save();
  }

  const testPhone = '+963912345678';
  const testPassword = 'TestPassword123!';

  logger.log('--- Cleaning up previous test data ---');
  await userModel.deleteOne({ phoneNumber: testPhone });
  await providerModel.deleteOne({ phone: testPhone });
  await notificationModel.deleteMany({ 'data.phoneNumber': testPhone });

  try {
    // 1. REGISTER
    logger.log('1. Registering new provider...');
    await authService.register({
      phoneNumber: testPhone,
      password: testPassword,
      fullName: 'Test Provider Garage',
      accountType: 'provider',
      isTermsAccepted: true,
    });

    // We bypass real OTP by manually getting it from DB or mocking
    // For this test, let's just forcefully verify it by extracting it from DB
    const pendingRegModel = app.get<Model<any>>(getModelToken('PendingRegistration'));
    const pending = await pendingRegModel.findOne({ phoneNumber: testPhone }).select('+otpCode');
    
    logger.log(`2. Verifying OTP (${pending.otpCode})...`);
    await authService.verifyOtp({
      phoneNumber: testPhone,
      otpCode: pending.otpCode,
    });

    // Verify Admin Notification
    const adminNotif = await notificationModel.findOne({ recipientId: admin._id });
    if (adminNotif && adminNotif.title.includes('New Provider Registration')) {
      logger.log('✅ Admin Notification Sent Successfully!');
    } else {
      logger.error('❌ Admin Notification Failed!');
    }

    const providerUser = (await userModel.findOne({ phoneNumber: testPhone }))!;
    const providerDoc = (await providerModel.findOne({ phone: testPhone }))!;

    // 3. ATTEMPT LOGIN (Should Fail because not active)
    logger.log('3. Attempting login before approval...');
    try {
      await authService.login({ phoneNumber: testPhone, password: testPassword });
      logger.error('❌ Login succeeded but should have failed (Account Deactivated)!');
    } catch (e: any) {
      if (e.message.includes('deactivated')) {
        logger.log('✅ Login prevented successfully (Account is pending approval)');
      } else {
        logger.error(`❌ Unexpected login error: ${e.message}`);
      }
    }

    // 4. ADMIN REJECTS
    logger.log('4. Admin Rejects the provider...');
    await adminProvidersService.rejectProvider(providerDoc._id.toString(), 'Missing commercial register');
    
    // Check Provider Notification
    const rejectNotif = await notificationModel.findOne({ recipientId: providerUser._id, title: 'Registration Update 🛑' });
    if (rejectNotif && rejectNotif.body.includes('Missing commercial register')) {
      logger.log('✅ Rejection Notification Sent to Provider Successfully!');
    } else {
      logger.error('❌ Rejection Notification Failed!');
    }

    // 5. ADMIN APPROVES
    logger.log('5. Admin Approves the provider...');
    await adminProvidersService.approveProvider(providerDoc._id.toString());

    // Check Provider Notification
    const approveNotif = await notificationModel.findOne({ recipientId: providerUser._id, title: 'Registration Approved! 🎉' });
    if (approveNotif) {
      logger.log('✅ Approval Notification Sent to Provider Successfully!');
    } else {
      logger.error('❌ Approval Notification Failed!');
    }

    // 6. ATTEMPT LOGIN AGAIN (Should Succeed)
    logger.log('6. Attempting login after approval...');
    const loginResponse = await authService.login({ phoneNumber: testPhone, password: testPassword });
    if (loginResponse.accessToken) {
      logger.log('✅ Login succeeded! Provider has access to Dashboard.');
    } else {
      logger.error('❌ Login failed after approval!');
    }

  } catch (err) {
    logger.error('Test Execution Failed:', err);
  } finally {
    logger.log('--- Test Finished, closing app ---');
    await app.close();
  }
}

bootstrap();

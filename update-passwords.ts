import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from './src/app.module';
import { Admin } from './src/database/schemas/admin.schema';
import * as bcrypt from 'bcrypt';

async function updateAdminPasswords() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const adminModel: Model<Admin> = app.get(getModelToken(Admin.name));
    
    // Hash new passwords
    const pass1 = await bcrypt.hash('Mohamed@123', 10);
    const pass2 = await bcrypt.hash('Nather@789', 10);
    
    // Update Mohammad
    await adminModel.updateOne(
      { email: 'mohammedmarawi3@gmail.com' },
      { $set: { password: pass1 } }
    );
    console.log('✅ Updated Mohammad\'s password to: Mohamed@123');

    // Update Nather
    await adminModel.updateOne(
      { email: 'natherayyan@gmail.com' },
      { $set: { password: pass2 } }
    );
    console.log('✅ Updated Nather\'s password to: Nather@789');

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

updateAdminPasswords();

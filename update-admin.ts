import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from './src/app.module';
import { Admin } from './src/database/schemas/admin.schema';

async function updateAdminName() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const adminModel: Model<Admin> = app.get(getModelToken(Admin.name));
    
    const result = await adminModel.updateOne(
      { email: 'natherayyan@gmail.com' },
      { $set: { name: 'nather ayyan' } }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Admin name updated successfully to "nather ayyan"');
    } else {
      console.log('❌ Admin email not found');
    }
  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

updateAdminName();

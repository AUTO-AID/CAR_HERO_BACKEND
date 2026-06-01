import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/application/services/auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../src/modules/users/infrastructure/persistence/mongoose/schemas/user.schema';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const userModel = app.get<Model<UserDocument>>(getModelToken('User'));

  try {
    const user = await userModel.findOne({ phoneNumber: '+963912345678' }).select('+password').lean();
    console.log('User found in DB:', user);
    if (user) {
      console.log('Is password valid?', await bcrypt.compare('Password123!', user.password));
    }

    const res = await authService.login({ phoneNumber: '+963912345678', password: 'Password123!' });
    console.log('Login success!', res);
  } catch (err: any) {
    console.error('Login failed:', err.message);
  }

  await app.close();
  process.exit(0);
}

bootstrap();

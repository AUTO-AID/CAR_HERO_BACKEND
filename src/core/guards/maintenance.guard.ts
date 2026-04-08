import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from '../../database/schemas/setting.schema';
import { Role } from '../../common/enums/roles.enum';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if the route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    
    // 2. Fetch maintenance setting
    const settings = await this.settingModel.findOne({ key: 'app_config' });
    
    if (!settings || !settings.maintenanceMode) {
      return true;
    }

    // 3. Allow Admins to bypass maintenance mode
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.role === Role.ADMIN) {
      return true;
    }
    
    throw new ServiceUnavailableException({
      statusCode: 503,
      message: settings.maintenanceMessage || 'System is under maintenance. Please try again later.',
      messageAr: settings.maintenanceMessageAr || 'النظام تحت الصيانة حالياً. يرجى المحاولة لاحقاً.',
    });
  }
}

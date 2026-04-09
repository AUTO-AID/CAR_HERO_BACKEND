import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Model } from 'mongoose';
import { SettingDocument } from '../../database/schemas/setting.schema';
export declare class MaintenanceGuard implements CanActivate {
    private reflector;
    private settingModel;
    constructor(reflector: Reflector, settingModel: Model<SettingDocument>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}

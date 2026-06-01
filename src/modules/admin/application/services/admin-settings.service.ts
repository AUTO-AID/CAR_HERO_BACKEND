import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from '../../../../modules/admin/infrastructure/persistence/mongoose/schemas/setting.schema';
import { UpdateAppSettingsDto, UpdateMaintenanceDto } from '../dtos/update-settings.dto';

const DEFAULTS = {
  appName: 'Car Hero - كار هيرو',
  appVersion: '1.0.0',
  contactEmail: 'support@carhero.com',
  contactPhone: '',
  commissionRate: 0.1,
  minWithdrawalAmount: 0,
  defaultCurrency: 'SYP',
  maintenanceMode: false,
  maintenanceMessage: '',
  maintenanceMessageAr: '',
};

@Injectable()
export class AdminSettingsService {
  constructor(@InjectModel(Setting.name) private settingModel: Model<SettingDocument>) {}

  async getAppSettings() {
    const rows = await this.settingModel.find({}).lean().exec();
    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const config = rows.find((row) => row.key === 'app_config');
    return {
      ...DEFAULTS,
      appName: values.app_name ?? DEFAULTS.appName,
      appVersion: values.app_version ?? DEFAULTS.appVersion,
      contactEmail: values.contact_email ?? DEFAULTS.contactEmail,
      contactPhone: values.contact_phone ?? DEFAULTS.contactPhone,
      commissionRate: Number(values.commission_rate ?? DEFAULTS.commissionRate),
      minWithdrawalAmount: Number(values.min_withdrawal_amount ?? DEFAULTS.minWithdrawalAmount),
      defaultCurrency: values.default_currency ?? DEFAULTS.defaultCurrency,
      maintenanceMode: Boolean(config?.maintenanceMode ?? values.maintenance_mode ?? DEFAULTS.maintenanceMode),
      maintenanceMessage: config?.maintenanceMessage ?? values.maintenance_message ?? DEFAULTS.maintenanceMessage,
      maintenanceMessageAr: config?.maintenanceMessageAr ?? values.maintenance_message_ar ?? DEFAULTS.maintenanceMessageAr,
    };
  }

  async updateAppSettings(dto: UpdateAppSettingsDto) {
    const mapping: Record<string, unknown> = {
      app_name: dto.appName?.trim(),
      contact_email: dto.contactEmail?.trim().toLowerCase(),
      contact_phone: dto.contactPhone?.trim(),
      commission_rate: dto.commissionRate,
      min_withdrawal_amount: dto.minWithdrawalAmount,
      default_currency: dto.defaultCurrency,
    };
    await Promise.all(Object.entries(mapping)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => this.settingModel.updateOne({ key }, { $set: { value } }, { upsert: true })));
    return this.getAppSettings();
  }

  async getPublicSettings() {
    const settings = await this.getAppSettings();
    return {
      appName: settings.appName,
      appVersion: settings.appVersion,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      defaultCurrency: settings.defaultCurrency,
    };
  }

  async updateMaintenanceMode(dto: UpdateMaintenanceDto) {
    const message = dto.message?.trim() ?? '';
    const messageAr = dto.messageAr?.trim() ?? '';
    await Promise.all([
      this.settingModel.findOneAndUpdate(
        { key: 'app_config' },
        { $set: { value: {}, maintenanceMode: dto.maintenanceMode, maintenanceMessage: message, maintenanceMessageAr: messageAr } },
        { upsert: true },
      ),
      this.settingModel.updateOne({ key: 'maintenance_mode' }, { $set: { value: dto.maintenanceMode } }, { upsert: true }),
      this.settingModel.updateOne({ key: 'maintenance_message' }, { $set: { value: message } }, { upsert: true }),
      this.settingModel.updateOne({ key: 'maintenance_message_ar' }, { $set: { value: messageAr } }, { upsert: true }),
    ]);
    return this.getAppSettings();
  }
}

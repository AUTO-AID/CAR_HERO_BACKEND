import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from '../../../../modules/admin/infrastructure/persistence/mongoose/schemas/admin.schema';
import { PasswordUtil } from '../../../../core/utils';
import { Role } from '../../../../core/enums/roles.enum';
import { CreateAdminDto } from '../dtos/admin-management.dto';

export interface AdminListFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  permission?: string;
}

@Injectable()
export class AdminAdminsService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
  ) {}

  async listAdmins(filters: AdminListFilters = {}) {
    const query: any = {};
    const search = filters.search?.trim();
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }
    if (filters.status === 'active') query.isActive = true;
    if (filters.status === 'inactive') query.isActive = false;
    if (filters.permission) query.permissions = filters.permission;

    const [admins, total, active, inactive, managers] = await Promise.all([
      this.adminModel.find(query).sort({ createdAt: -1 }).lean().exec(),
      this.adminModel.countDocuments(),
      this.adminModel.countDocuments({ isActive: true }),
      this.adminModel.countDocuments({ isActive: false }),
      this.adminModel.countDocuments({ isActive: true, permissions: { $in: ['*', 'all', 'admins.update'] } }),
    ]);

    return { admins, total, stats: { total, active, inactive, managers } };
  }

  async createAdmin(adminData: CreateAdminDto) {
    const email = adminData.email.trim().toLowerCase();
    if (await this.adminModel.exists({ email })) {
      throw new ConflictException('An admin account already exists for this email');
    }

    const admin = await this.adminModel.create({
      email,
      password: await PasswordUtil.hash(adminData.password),
      name: adminData.name.trim(),
      permissions: adminData.permissions || [],
      role: Role.ADMIN,
    });
    return this.toPublicAdmin(admin);
  }

  async updateAdminPermissions(id: string, permissions: string[], actorId: string) {
    const admin = await this.getAdmin(id);
    if (id === actorId && !this.canManageAdmins(permissions)) {
      throw new BadRequestException('You cannot remove your own admin management access');
    }
    if (this.canManageAdmins(admin.permissions) && !this.canManageAdmins(permissions)) {
      await this.assertAnotherActiveManager(id);
    }

    admin.permissions = permissions;
    await admin.save();
    return this.toPublicAdmin(admin);
  }

  async toggleAdminStatus(id: string, isActive: boolean, actorId: string) {
    if (id === actorId && !isActive) {
      throw new BadRequestException('You cannot deactivate your own account');
    }
    const admin = await this.getAdmin(id);
    if (!isActive && admin.isActive && this.canManageAdmins(admin.permissions)) {
      await this.assertAnotherActiveManager(id);
    }
    admin.isActive = isActive;
    if (!isActive) admin.refreshToken = undefined;
    await admin.save();
    return this.toPublicAdmin(admin);
  }

  async resetAdminPassword(id: string, password: string, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException('Use the profile password workflow to change your own password');
    }
    const admin = await this.getAdmin(id);
    admin.password = await PasswordUtil.hash(password);
    admin.refreshToken = undefined;
    await admin.save();
    return { message: 'Admin password reset successfully' };
  }

  async deleteAdmin(id: string, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const admin = await this.getAdmin(id);
    if (admin.isActive && this.canManageAdmins(admin.permissions)) {
      await this.assertAnotherActiveManager(id);
    }
    await admin.deleteOne();
    return { message: 'Admin deleted successfully' };
  }

  private async getAdmin(id: string) {
    const admin = await this.adminModel.findById(id).select('+password +refreshToken').exec();
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  private canManageAdmins(permissions: string[]) {
    return permissions.some((permission) => ['*', 'all', 'admins.update'].includes(permission));
  }

  private async assertAnotherActiveManager(excludedId: string) {
    const count = await this.adminModel.countDocuments({
      _id: { $ne: excludedId },
      isActive: true,
      permissions: { $in: ['*', 'all', 'admins.update'] },
    });
    if (!count) throw new ForbiddenException('At least one active admin manager must remain');
  }

  private toPublicAdmin(admin: AdminDocument) {
    const value = admin.toObject();
    delete value.password;
    delete value.refreshToken;
    return value;
  }
}

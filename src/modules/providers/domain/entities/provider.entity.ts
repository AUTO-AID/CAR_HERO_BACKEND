import { Role } from '../../../../core/enums/roles.enum';
import { ProviderStatus, ServiceCategory, RegistrationStatus } from '../../../../core/enums/status.enum';

export class ProviderEntity {
  constructor(
    public readonly id: string,
    public readonly phone: string,
    public readonly businessName: string,
    public readonly role: Role,
    public readonly status: ProviderStatus,
    public readonly registrationStatus: RegistrationStatus,
    public readonly isApproved: boolean,
    public readonly isActive: boolean,
    public readonly location: { type: string; coordinates: number[] },
    public readonly serviceCategories: ServiceCategory[],
    public readonly averageRating: number,
    public readonly totalReviews: number,
    public readonly totalOrders: number,
    public readonly email?: string,
    public readonly ownerName?: string,
    public readonly description?: string,
    public readonly logo?: string,
    public readonly images: string[] = [],
    public readonly address?: string,
    public readonly services: string[] = [],
    public readonly workingHours: any[] = [],
    public readonly documents: string[] = [],
    public readonly bankAccount?: Record<string, any>,
    public readonly rejectionReason?: string,
    public readonly city?: string,
    public readonly lastOnlineAt?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * Check if provider is available for new orders
   */
  isAvailable(): boolean {
    return this.isActive && this.isApproved && this.status === ProviderStatus.ONLINE;
  }
}

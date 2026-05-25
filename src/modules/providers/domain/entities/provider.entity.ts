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
    public readonly businessType?: string,
    public readonly category?: string,
    public readonly accountStatus?: string,
    public readonly coverageAreas: string[] = [],
    public readonly requestedServices: string[] = [],
    public readonly services_list: Record<string, any>[] = [],
    public readonly servicePrices: Record<string, any> = {},
    public readonly emergency247: boolean = false,
    public readonly is_emergency: boolean = false,
    public readonly serviceRadiusKm: number = 0,
    public readonly paymentMethods: string[] = [],
    public readonly facilities: string[] = [],
    public readonly experienceYears: number = 0,
    public readonly techCount: number = 0,
    public readonly shopPhotos: Record<string, any>[] = [],
    public readonly website?: string,
    public readonly facebookUrl?: string,
    public readonly slug?: string,
    public readonly plusCode?: string,
    public readonly googleId?: string,
    public readonly tags: string[] = [],
    public readonly isPhoneVerified: boolean = false,
  ) {}

  /**
   * Check if provider is available for new orders
   */
  isAvailable(): boolean {
    return this.isActive && this.isApproved && this.status === ProviderStatus.ONLINE;
  }
}

import { ServiceCategory } from '../../../../core/enums/status.enum';

export class ServiceEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly nameAr: string,
    public readonly category: ServiceCategory,
    public readonly basePrice: number,
    public readonly estimatedDuration: number,
    public readonly isActive: boolean,
    public readonly description?: string,
    public readonly descriptionAr?: string,
    public readonly icon?: string,
    public readonly image?: string,
    public readonly discountedPrice: number = 0,
    public readonly isEmergency: boolean = false,
    public readonly sortOrder: number = 0,
    public readonly provider?: string,
    public readonly isSystemService: boolean = false,
    public readonly options: any[] = [],
    public readonly metadata: Record<string, any> = {},
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}

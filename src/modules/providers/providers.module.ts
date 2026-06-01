import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProvidersController } from './presentation/controllers/providers.controller';
import { ProvidersService } from './application/services/providers.service'; // Keep for backward compatibility if needed, or remove
import { Provider, ProviderSchema } from './infrastructure/persistence/mongoose/schemas/provider.schema';

// Repository
import { IProviderRepository } from './domain/repositories/provider.repository.interface';
import { MongooseProviderRepository } from './infrastructure/repositories/mongoose-provider.repository';

// Use Cases
import { GetProvidersUseCase } from './application/use-cases/get-providers.use-case';
import { GetProviderByIdUseCase } from './application/use-cases/get-provider-by-id.use-case';
import { UpdateProviderUseCase } from './application/use-cases/update-provider.use-case';
import { UpdateProviderLocationUseCase } from './application/use-cases/update-provider-location.use-case';
import { UpdateProviderStatusUseCase } from './application/use-cases/update-provider-status.use-case';
import { FindNearbyProvidersUseCase } from './application/use-cases/find-nearby-providers.use-case';
import { ApproveProviderUseCase } from './application/use-cases/approve-provider.use-case';
import { UpdateProviderRatingUseCase } from './application/use-cases/update-provider-rating.use-case';
import { RecalculateProviderRatingUseCase } from './application/use-cases/recalculate-provider-rating.use-case';
import { ManageProvidersUseCase } from './application/use-cases/manage-providers.use-case';
import { GetProviderStatsUseCase } from './application/use-cases/get-provider-stats.use-case';
import { GetProviderDashboardUseCase } from './application/use-cases/get-provider-dashboard.use-case';
import { GetTopRatedProvidersUseCase } from './application/use-cases/get-top-rated-providers.use-case';

import { Order, OrderSchema } from '../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { Service, ServiceSchema } from '../services/infrastructure/persistence/mongoose/schemas/service.schema';

const UseCases = [
  GetProvidersUseCase,
  GetProviderByIdUseCase,
  UpdateProviderUseCase,
  UpdateProviderLocationUseCase,
  UpdateProviderStatusUseCase,
  FindNearbyProvidersUseCase,
  ApproveProviderUseCase,
  UpdateProviderRatingUseCase,
  RecalculateProviderRatingUseCase,
  ManageProvidersUseCase,
  GetProviderStatsUseCase,
  GetProviderDashboardUseCase,
  GetTopRatedProvidersUseCase,
];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Provider.name, schema: ProviderSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [ProvidersController],
  providers: [
    ProvidersService, // Legacy
    {
      provide: IProviderRepository,
      useClass: MongooseProviderRepository,
    },
    ...UseCases,
  ],
  exports: [
    ProvidersService,
    IProviderRepository,
    ...UseCases,
    MongooseModule,
  ],
})
export class ProvidersModule {}

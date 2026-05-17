import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesController } from './presentation/controllers/services.controller';
import { Service, ServiceSchema } from './infrastructure/persistence/mongoose/schemas/service.schema';

// Repository
import { IServiceRepository } from './domain/repositories/service.repository.interface';
import { MongooseServiceRepository } from './infrastructure/repositories/mongoose-service.repository';

// Use Cases
import { GetServicesUseCase } from './application/use-cases/get-services.use-case';
import { GetServiceByIdUseCase } from './application/use-cases/get-service-by-id.use-case';
import { ManageServicesUseCase } from './application/use-cases/manage-services.use-case';
import { GetServiceStatsUseCase } from './application/use-cases/get-service-stats.use-case';

const UseCases = [
  GetServicesUseCase,
  GetServiceByIdUseCase,
  ManageServicesUseCase,
  GetServiceStatsUseCase,
];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
  ],
  controllers: [ServicesController],
  providers: [
    {
      provide: IServiceRepository,
      useClass: MongooseServiceRepository,
    },
    ...UseCases,
  ],
  exports: [
    IServiceRepository,
    ...UseCases,
    MongooseModule,
  ],
})
export class ServicesModule {}

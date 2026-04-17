import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesController } from './presentation/controllers/services.controller';
import { Service, ServiceSchema } from '../../modules/services/infrastructure/persistence/mongoose/schemas/service.schema';

// Repository
import { IServiceRepository } from './domain/repositories/service.repository.interface';
import { MongooseServiceRepository } from './infrastructure/repositories/mongoose-service.repository';

// Use Cases
import { GetServicesUseCase } from './application/use-cases/get-services.use-case';

const UseCases = [
  GetServicesUseCase,
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

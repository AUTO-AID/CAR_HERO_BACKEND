import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Role } from '../../../../core/enums/roles.enum';
import { ServiceCategory } from '../../../../core/enums/status.enum';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { GetServiceByIdUseCase } from '../../application/use-cases/get-service-by-id.use-case';
import { GetServiceStatsUseCase } from '../../application/use-cases/get-service-stats.use-case';
import { GetServicesUseCase } from '../../application/use-cases/get-services.use-case';
import { ManageServicesUseCase } from '../../application/use-cases/manage-services.use-case';
import { ServicesController } from './services.controller';

describe('ServicesController HTTP endpoints', () => {
  let app: INestApplication;

  const useCases = {
    getServices: {
      execute: jest.fn().mockResolvedValue([{ id: 'service-id' }]),
      list: jest.fn().mockResolvedValue({ services: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } }),
      emergency: jest.fn().mockResolvedValue([]),
      categories: jest.fn().mockResolvedValue([]),
      search: jest.fn().mockResolvedValue([]),
    },
    getById: { execute: jest.fn().mockResolvedValue({ id: 'service-id' }) },
    manage: {
      create: jest.fn().mockResolvedValue({ id: 'service-id' }),
      update: jest.fn().mockResolvedValue({ id: 'service-id' }),
      setActive: jest.fn().mockResolvedValue({ id: 'service-id', isActive: true }),
      delete: jest.fn().mockResolvedValue({ message: 'deleted' }),
    },
    stats: { execute: jest.fn().mockResolvedValue({ total: 1 }) },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        { provide: GetServicesUseCase, useValue: useCases.getServices },
        { provide: GetServiceByIdUseCase, useValue: useCases.getById },
        { provide: ManageServicesUseCase, useValue: useCases.manage },
        { provide: GetServiceStatsUseCase, useValue: useCases.stats },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          context.switchToHttp().getRequest().user = { id: 'admin-id', role: Role.ADMIN };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves every service route', async () => {
    const server = app.getHttpServer();
    const createPayload = {
      name: 'Car Wash',
      nameAr: 'Car Wash',
      category: ServiceCategory.CAR_WASH,
      basePrice: 100,
      estimatedDuration: 30,
    };

    await request(server).get('/services').expect(200);
    await request(server).get('/services/categories').expect(200);
    await request(server).get('/services/emergency').expect(200);
    await request(server).get('/services/search?query=wash').expect(200);
    await request(server).get('/services/service-id').expect(200);
    await request(server).get('/services/admin/list').expect(200);
    await request(server).get('/services/admin/stats').expect(200);
    await request(server).get('/services/admin/service-id').expect(200);
    await request(server).post('/services/admin').send(createPayload).expect(201);
    await request(server).patch('/services/admin/service-id').send({ basePrice: 120 }).expect(200);
    await request(server).patch('/services/admin/service-id/status').send({ isActive: false }).expect(200);
    await request(server).delete('/services/admin/service-id').expect(200);
  });
});

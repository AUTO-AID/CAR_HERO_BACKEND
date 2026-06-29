import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { Role } from '../../../../core/enums/roles.enum';
import { ProviderStatus, ServiceCategory } from '../../../../core/enums/status.enum';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { PermissionsGuard } from '../../../../core/guards/permissions.guard';
import { ParseObjectIdPipe } from '../../../../core/pipes/parse-objectid.pipe';
import { ApproveProviderUseCase } from '../../application/use-cases/approve-provider.use-case';
import { FindNearbyProvidersUseCase } from '../../application/use-cases/find-nearby-providers.use-case';
import { GetProviderByIdUseCase } from '../../application/use-cases/get-provider-by-id.use-case';
import { GetProviderStatsUseCase } from '../../application/use-cases/get-provider-stats.use-case';
import { GetProvidersUseCase } from '../../application/use-cases/get-providers.use-case';
import { GetTopRatedProvidersUseCase } from '../../application/use-cases/get-top-rated-providers.use-case';
import { ManageProvidersUseCase } from '../../application/use-cases/manage-providers.use-case';
import { UpdateProviderLocationUseCase } from '../../application/use-cases/update-provider-location.use-case';
import { UpdateProviderStatusUseCase } from '../../application/use-cases/update-provider-status.use-case';
import { UpdateProviderUseCase } from '../../application/use-cases/update-provider.use-case';
import { ProvidersController } from './providers.controller';
import { GetProviderDashboardUseCase } from '../../application/use-cases/get-provider-dashboard.use-case';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';

describe('ProvidersController HTTP endpoints', () => {
  let app: INestApplication;
  const providerId = '507f1f77bcf86cd799439011';

  const useCases = {
    list: { execute: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }) },
    getById: { execute: jest.fn().mockResolvedValue({ id: providerId }) },
    update: { execute: jest.fn().mockResolvedValue({ id: providerId }) },
    location: { execute: jest.fn().mockResolvedValue({ id: providerId }) },
    status: { execute: jest.fn().mockResolvedValue({ id: providerId, status: ProviderStatus.ONLINE }) },
    nearby: { execute: jest.fn().mockResolvedValue([]) },
    approve: { execute: jest.fn().mockResolvedValue({ id: providerId, isApproved: true }) },
    manage: {
      create: jest.fn().mockResolvedValue({ id: providerId }),
      reject: jest.fn().mockResolvedValue({ id: providerId }),
      setActive: jest.fn().mockResolvedValue({ id: providerId }),
      updateServices: jest.fn().mockResolvedValue({ id: providerId }),
      updateWorkingHours: jest.fn().mockResolvedValue({ id: providerId }),
      updateDocuments: jest.fn().mockResolvedValue({ id: providerId }),
      updateBankAccount: jest.fn().mockResolvedValue({ id: providerId }),
    },
    stats: { execute: jest.fn().mockResolvedValue({ total: 1 }) },
    topRated: { execute: jest.fn().mockResolvedValue([]) },
    dashboard: { execute: jest.fn().mockResolvedValue({}) },
    audit: { record: jest.fn().mockResolvedValue(undefined) },
    repository: {
      delete: jest.fn().mockResolvedValue(undefined),
      findByPhone: jest.fn().mockResolvedValue({ id: providerId }),
    },
    connection: { collection: jest.fn() },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProvidersController],
      providers: [
        ParseObjectIdPipe,
        { provide: GetProvidersUseCase, useValue: useCases.list },
        { provide: GetProviderByIdUseCase, useValue: useCases.getById },
        { provide: UpdateProviderUseCase, useValue: useCases.update },
        { provide: UpdateProviderLocationUseCase, useValue: useCases.location },
        { provide: UpdateProviderStatusUseCase, useValue: useCases.status },
        { provide: FindNearbyProvidersUseCase, useValue: useCases.nearby },
        { provide: ApproveProviderUseCase, useValue: useCases.approve },
        { provide: ManageProvidersUseCase, useValue: useCases.manage },
        { provide: GetProviderStatsUseCase, useValue: useCases.stats },
        { provide: GetTopRatedProvidersUseCase, useValue: useCases.topRated },
        { provide: GetProviderDashboardUseCase, useValue: useCases.dashboard },
        { provide: AuditLogService, useValue: useCases.audit },
        { provide: IProviderRepository, useValue: useCases.repository },
        { provide: getConnectionToken(), useValue: useCases.connection },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          context.switchToHttp().getRequest().user = { id: providerId, phone: '+963999999999', role: Role.ADMIN };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves every provider route', async () => {
    const server = app.getHttpServer();
    const createPayload = {
      phone: '+963999999999',
      businessName: 'Hero Garage',
      longitude: 36.2,
      latitude: 33.5,
    };

    await request(server).get('/providers').expect(200);
    await request(server).get('/providers/nearby?longitude=36.2&latitude=33.5').expect(200);
    await request(server).get('/providers/top-rated?limit=5').expect(200);
    await request(server).get(`/providers/${providerId}`).expect(200);
    await request(server).get('/providers/me').expect(200);
    await request(server).put('/providers/me').send({ businessName: 'New' }).expect(200);
    await request(server).put('/providers/me/location').send({ longitude: 36.2, latitude: 33.5 }).expect(200);
    await request(server).put('/providers/me/status').send({ status: ProviderStatus.ONLINE }).expect(200);
    await request(server).put('/providers/me/services').send({ services: ['service-id'], serviceCategories: [ServiceCategory.TOWING] }).expect(200);
    await request(server).put('/providers/me/working-hours').send({ workingHours: [{ day: 'sat', open: '09:00', close: '17:00' }] }).expect(200);
    await request(server).put('/providers/me/documents').send({ documents: ['doc.pdf'] }).expect(200);
    await request(server).put('/providers/me/bank-account').send({ bankAccount: { iban: 'SY123' } }).expect(200);
    await request(server).get('/providers/admin/stats').expect(200);
    await request(server).post('/providers/admin').send(createPayload).expect(201);
    await request(server).get(`/providers/admin/${providerId}`).expect(200);
    await request(server).patch(`/providers/admin/${providerId}`).send({ ownerName: 'Owner' }).expect(200);
    await request(server).patch(`/providers/admin/${providerId}/status`).send({ isActive: false }).expect(200);
    await request(server).patch(`/providers/admin/${providerId}/reject`).send({ reason: 'missing documents' }).expect(200);
    await request(server).delete(`/providers/admin/${providerId}`).expect(200);
    await request(server).post(`/providers/${providerId}/approve`).expect(201);
  });
});

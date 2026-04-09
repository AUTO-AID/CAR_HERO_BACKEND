import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateMaintenanceRecordUseCase } from './create-maintenance-record.use-case';
import { IMaintenanceRecordRepository } from '../../domain/repositories/maintenance-record.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';
import { CreateMaintenanceRecordDto } from '../dto/create-maintenance-record.dto';

describe('CreateMaintenanceRecordUseCase', () => {
  let useCase: CreateMaintenanceRecordUseCase;
  let maintenanceRepository: jest.Mocked<IMaintenanceRecordRepository>;
  let vehicleRepository: jest.Mocked<IVehicleRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockRecord: Partial<MaintenanceRecordEntity> = {
    id: 'mr1',
    vehicleId: 'v1',
    userId: 'user1',
    serviceType: 'تغيير زيت',
    description: 'تم تغيير الزيت والفلتر',
    cost: 250,
    createdAt: new Date(),
  };

  const createDto: CreateMaintenanceRecordDto = {
    serviceType: 'تغيير زيت',
    description: 'تم تغيير الزيت والفلتر',
    cost: 250,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateMaintenanceRecordUseCase,
        {
          provide: IMaintenanceRecordRepository,
          useValue: { create: jest.fn() },
        },
        {
          provide: IVehicleRepository,
          useValue: { belongsToUser: jest.fn(), findById: jest.fn() },
        },
        {
          provide: CACHE_MANAGER,
          useValue: { del: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<CreateMaintenanceRecordUseCase>(CreateMaintenanceRecordUseCase);
    maintenanceRepository = module.get(IMaintenanceRecordRepository);
    vehicleRepository = module.get(IVehicleRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw ForbiddenException if user does not own vehicle', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(false);

      await expect(useCase.execute('v1', createDto, 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('v1', createDto, 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create maintenance record successfully', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue({} as any);
      maintenanceRepository.create.mockResolvedValue(mockRecord as MaintenanceRecordEntity);

      const result = await useCase.execute('v1', createDto, 'user1');

      expect(maintenanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: 'v1',
          userId: 'user1',
          serviceType: 'تغيير زيت',
        }),
      );
      expect(result).toEqual(mockRecord);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GetVehiclesUseCase } from './get-vehicles.use-case';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';

describe('GetVehiclesUseCase', () => {
  let useCase: GetVehiclesUseCase;
  let vehicleRepository: jest.Mocked<IVehicleRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockVehicles: VehicleEntity[] = [
    {
      id: 'v1',
      userId: 'user1',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'أبيض',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as VehicleEntity,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVehiclesUseCase,
        {
          provide: IVehicleRepository,
          useValue: {
            findByUserId: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetVehiclesUseCase>(GetVehiclesUseCase);
    vehicleRepository = module.get(IVehicleRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return vehicles from cache if available', async () => {
      const cachedResult = { vehicles: mockVehicles, pagination: { total: 1, page: 1, limit: 10, pages: 1 } };
      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await useCase.execute('user1', 1, 10);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(vehicleRepository.findByUserId).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should fetch from database and cache if not in cache', async () => {
      cacheManager.get.mockResolvedValue(null);
      vehicleRepository.findByUserId.mockResolvedValue({
        vehicles: mockVehicles,
        total: 1,
      });

      const result = await useCase.execute('user1', 1, 10);

      expect(vehicleRepository.findByUserId).toHaveBeenCalledWith('user1', 0, 10);
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result.vehicles).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });
});

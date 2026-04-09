import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GetUserVehiclesUseCase } from './get-user-vehicles.use-case';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';

describe('GetUserVehiclesUseCase', () => {
  let useCase: GetUserVehiclesUseCase;
  let vehicleRepository: jest.Mocked<IVehicleRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockVehicles: VehicleEntity[] = [
    {
      id: 'v1',
      userId: 'user1',
      brand: 'Toyota',
      model: 'Camry',
      year: 2020,
      plateNumber: 'أ ب ش 1234',
      color: 'أبيض',
      isDefault: true,
    } as VehicleEntity,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserVehiclesUseCase,
        {
          provide: IVehicleRepository,
          useValue: {
            findByUserIdAdmin: jest.fn(),
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

    useCase = module.get<GetUserVehiclesUseCase>(GetUserVehiclesUseCase);
    vehicleRepository = module.get(IVehicleRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return cached results if available', async () => {
      const cachedResult = { vehicles: mockVehicles, pagination: { total: 1, page: 1, limit: 10, pages: 1 } };
      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await useCase.execute('user1', 1, 10);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(vehicleRepository.findByUserIdAdmin).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should fetch user vehicles from database if not cached', async () => {
      cacheManager.get.mockResolvedValue(null);
      vehicleRepository.findByUserIdAdmin.mockResolvedValue({
        vehicles: mockVehicles,
        total: 1,
      });

      const result = await useCase.execute('user1', 1, 10);

      expect(vehicleRepository.findByUserIdAdmin).toHaveBeenCalledWith('user1', 0, 10);
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result.vehicles).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });
});

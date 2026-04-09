import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GetVehicleByIdUseCase } from './get-vehicle-by-id.use-case';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';

describe('GetVehicleByIdUseCase', () => {
  let useCase: GetVehicleByIdUseCase;
  let vehicleRepository: jest.Mocked<IVehicleRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockVehicle: VehicleEntity = {
    id: 'v1',
    userId: 'user1',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    color: 'أبيض',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as VehicleEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVehicleByIdUseCase,
        {
          provide: IVehicleRepository,
          useValue: {
            findById: jest.fn(),
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

    useCase = module.get<GetVehicleByIdUseCase>(GetVehicleByIdUseCase);
    vehicleRepository = module.get(IVehicleRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw NotFoundException if vehicle not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      vehicleRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('v1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own vehicle', async () => {
      cacheManager.get.mockResolvedValue(null);
      vehicleRepository.findById.mockResolvedValue({
        ...mockVehicle,
        userId: 'user2',
      });

      await expect(useCase.execute('v1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return vehicle if user owns it', async () => {
      cacheManager.get.mockResolvedValue(null);
      vehicleRepository.findById.mockResolvedValue(mockVehicle);

      const result = await useCase.execute('v1', 'user1');

      expect(result).toEqual(mockVehicle);
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should return cached vehicle if available', async () => {
      cacheManager.get.mockResolvedValue(mockVehicle);

      const result = await useCase.execute('v1', 'user1');

      expect(cacheManager.get).toHaveBeenCalledWith('vehicle_v1');
      expect(vehicleRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockVehicle);
    });
  });
});

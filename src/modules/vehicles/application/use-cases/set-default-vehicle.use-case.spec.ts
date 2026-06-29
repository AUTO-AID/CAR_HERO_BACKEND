import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SetDefaultVehicleUseCase } from './set-default-vehicle.use-case';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';

describe('SetDefaultVehicleUseCase', () => {
  let useCase: SetDefaultVehicleUseCase;
  let vehicleRepository: jest.Mocked<IVehicleRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockVehicle: VehicleEntity = {
    id: 'v1',
    userId: 'user1',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    color: 'أبيض',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as VehicleEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetDefaultVehicleUseCase,
        {
          provide: IVehicleRepository,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
            belongsToUser: jest.fn(),
            findByUserId: jest.fn(),
            setAsDefault: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<SetDefaultVehicleUseCase>(SetDefaultVehicleUseCase);
    vehicleRepository = module.get(IVehicleRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw ForbiddenException if user does not own vehicle', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(false);

      await expect(useCase.execute('v1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('v1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return vehicle if already default', async () => {
      const defaultVehicle = { ...mockVehicle, isDefault: true };
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(defaultVehicle);

      const result = await useCase.execute('v1', 'user1');

      expect(vehicleRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual(defaultVehicle);
    });

    it('should unset other defaults and set vehicle as default', async () => {
      const otherDefault = { id: 'v2', isDefault: true } as VehicleEntity;
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(mockVehicle);
      vehicleRepository.findByUserId.mockResolvedValue({
        vehicles: [otherDefault, mockVehicle],
        total: 2,
      });
      vehicleRepository.setAsDefault.mockResolvedValue({ ...mockVehicle, isDefault: true });

      const result = await useCase.execute('v1', 'user1');

      expect(vehicleRepository.update).not.toHaveBeenCalled();
      expect(vehicleRepository.setAsDefault).toHaveBeenCalledWith('user1', 'v1');
      expect(result.isDefault).toBe(true);
    });
  });
});

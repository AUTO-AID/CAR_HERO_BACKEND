import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DeleteVehicleUseCase } from './delete-vehicle.use-case';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';

describe('DeleteVehicleUseCase', () => {
  let useCase: DeleteVehicleUseCase;
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
        DeleteVehicleUseCase,
        {
          provide: IVehicleRepository,
          useValue: {
            findById: jest.fn(),
            delete: jest.fn(),
            belongsToUser: jest.fn(),
            countByUserId: jest.fn(),
            findByUserId: jest.fn(),
            update: jest.fn(),
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

    useCase = module.get<DeleteVehicleUseCase>(DeleteVehicleUseCase);
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

    it('should throw BadRequestException when deleting only default vehicle', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue({ ...mockVehicle, isDefault: true });
      vehicleRepository.countByUserId.mockResolvedValue(1);

      await expect(useCase.execute('v1', 'user1')).rejects.toThrow(
        'Cannot delete your only default vehicle. Please add another vehicle first.',
      );
    });

    it('should delete vehicle successfully', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(mockVehicle);
      vehicleRepository.countByUserId.mockResolvedValue(2);
      vehicleRepository.delete.mockResolvedValue(true);

      await useCase.execute('v1', 'user1');

      expect(vehicleRepository.delete).toHaveBeenCalledWith('v1');
      expect(cacheManager.del).toHaveBeenCalled();
    });

    it('should set another vehicle as default when deleting default vehicle', async () => {
      const defaultVehicle = { ...mockVehicle, isDefault: true };
      const otherVehicle = { id: 'v2', isDefault: false } as VehicleEntity;

      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(defaultVehicle);
      vehicleRepository.countByUserId.mockResolvedValue(2);
      vehicleRepository.findByUserId.mockResolvedValue({
        vehicles: [defaultVehicle, otherVehicle],
        total: 2,
      });
      vehicleRepository.delete.mockResolvedValue(true);

      await useCase.execute('v1', 'user1');

      expect(vehicleRepository.update).toHaveBeenCalledWith('v2', {
        isDefault: true,
      });
    });
  });
});

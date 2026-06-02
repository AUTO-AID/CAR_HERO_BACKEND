import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UpdateVehicleUseCase } from './update-vehicle.use-case';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';

describe('UpdateVehicleUseCase', () => {
  let useCase: UpdateVehicleUseCase;
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

  const updateDto: UpdateVehicleDto = {
    color: 'أسود',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateVehicleUseCase,
        {
          provide: IVehicleRepository,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
            belongsToUser: jest.fn(),
            findByUserId: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            set: jest.fn(),
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<UpdateVehicleUseCase>(UpdateVehicleUseCase);
    vehicleRepository = module.get(IVehicleRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw ForbiddenException if user does not own vehicle', async () => {
      vehicleRepository.findById.mockResolvedValue(mockVehicle);
      vehicleRepository.belongsToUser.mockResolvedValue(false);

      await expect(useCase.execute('v1', updateDto, 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('v1', updateDto, 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update vehicle successfully', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(mockVehicle);
      vehicleRepository.update.mockResolvedValue({ ...mockVehicle, color: 'أسود' });

      const result = await useCase.execute('v1', updateDto, 'user1');

      expect(vehicleRepository.update).toHaveBeenCalledWith('v1', { color: 'أسود' });
      expect(result.color).toBe('أسود');
    });

    it('should throw BadRequestException for invalid year', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(mockVehicle);

      const invalidDto: UpdateVehicleDto = { year: 1850 };
      await expect(useCase.execute('v1', invalidDto, 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should unset other defaults when setting isDefault to true', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(mockVehicle);
      vehicleRepository.findByUserId.mockResolvedValue({
        vehicles: [{ id: 'v2', isDefault: true } as VehicleEntity, mockVehicle],
        total: 2,
      });
      vehicleRepository.update.mockResolvedValue({ ...mockVehicle, isDefault: true });

      await useCase.execute('v1', { isDefault: true }, 'user1');

      expect(vehicleRepository.update).toHaveBeenCalledWith('v2', {
        isDefault: false,
      });
    });
  });
});

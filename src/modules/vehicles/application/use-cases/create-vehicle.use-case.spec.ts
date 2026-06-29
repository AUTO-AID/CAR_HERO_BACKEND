import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateVehicleUseCase } from './create-vehicle.use-case';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';

describe('CreateVehicleUseCase', () => {
  let useCase: CreateVehicleUseCase;
  let vehicleRepository: jest.Mocked<IVehicleRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockVehicle: Partial<VehicleEntity> = {
    id: 'v1',
    userId: 'user1',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    color: 'أبيض',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createVehicleDto: CreateVehicleDto = {
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    color: 'أبيض',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateVehicleUseCase,
        {
          provide: IVehicleRepository,
          useValue: {
            create: jest.fn(),
            countByUserId: jest.fn(),
            findByUserId: jest.fn(),
            update: jest.fn(),
            setAsDefault: jest.fn(),
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

    useCase = module.get<CreateVehicleUseCase>(CreateVehicleUseCase);
    vehicleRepository = module.get(IVehicleRepository);
    cacheManager = module.get(CACHE_MANAGER);

    // Default mock implementation
    vehicleRepository.findByUserId.mockResolvedValue({ vehicles: [], total: 0 });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create a vehicle successfully', async () => {
      vehicleRepository.countByUserId.mockResolvedValue(0);
      vehicleRepository.create.mockResolvedValue(mockVehicle as VehicleEntity);
      vehicleRepository.setAsDefault.mockResolvedValue(mockVehicle as VehicleEntity);

      const result = await useCase.execute(createVehicleDto, 'user1');

      expect(vehicleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          make: 'Toyota',
          model: 'Camry',
          isDefault: true, // First vehicle auto-default
        }),
      );
      expect(result).toEqual(mockVehicle);
    });

    it('should throw BadRequestException for invalid year (too old)', async () => {
      const invalidDto: CreateVehicleDto = {
        ...createVehicleDto,
        year: 1850,
      };

      await expect(useCase.execute(invalidDto, 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid year (future)', async () => {
      const currentYear = new Date().getFullYear();
      const invalidDto: CreateVehicleDto = {
        ...createVehicleDto,
        year: currentYear + 5,
      };

      await expect(useCase.execute(invalidDto, 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid VIN length', async () => {
      const invalidDto: CreateVehicleDto = {
        ...createVehicleDto,
        vin: 'SHORT123',
      };

      await expect(useCase.execute(invalidDto, 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when max vehicles reached', async () => {
      vehicleRepository.countByUserId.mockResolvedValue(10);

      await expect(useCase.execute(createVehicleDto, 'user1')).rejects.toThrow(
        'Maximum number of vehicles reached (10). Please remove a vehicle first.',
      );
    });

    it('should unset other defaults when isDefault is true', async () => {
      const existingVehicle = { id: 'v0', isDefault: true } as VehicleEntity;
      vehicleRepository.countByUserId.mockResolvedValue(1);
      vehicleRepository.findByUserId.mockResolvedValue({
        vehicles: [existingVehicle],
        total: 1,
      });
      vehicleRepository.create.mockResolvedValue(mockVehicle as VehicleEntity);

      const dtoWithDefault: CreateVehicleDto = { ...createVehicleDto, isDefault: true };
      await useCase.execute(dtoWithDefault, 'user1');

      expect(vehicleRepository.setAsDefault).toHaveBeenCalledWith('user1', 'v1');
    });
  });
});

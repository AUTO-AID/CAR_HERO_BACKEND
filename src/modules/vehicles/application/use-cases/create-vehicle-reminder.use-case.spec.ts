import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateVehicleReminderUseCase } from './create-vehicle-reminder.use-case';
import { IVehicleReminderRepository } from '../../domain/repositories/vehicle-reminder.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleReminderEntity, ReminderType } from '../../domain/entities/vehicle-reminder.entity';
import { CreateVehicleReminderDto } from '../dto/create-vehicle-reminder.dto';

describe('CreateVehicleReminderUseCase', () => {
  let useCase: CreateVehicleReminderUseCase;
  let reminderRepository: jest.Mocked<IVehicleReminderRepository>;
  let vehicleRepository: jest.Mocked<IVehicleRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockReminder: Partial<VehicleReminderEntity> = {
    id: 'r1',
    vehicleId: 'v1',
    userId: 'user1',
    type: ReminderType.OIL_CHANGE,
    title: 'تغيير زيت',
    reminderDate: new Date('2025-03-01'),
    isActive: true,
  };

  const createDto: CreateVehicleReminderDto = {
    type: ReminderType.OIL_CHANGE,
    title: 'تغيير زيت',
    reminderDate: '2025-03-01T10:00:00.000Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateVehicleReminderUseCase,
        {
          provide: IVehicleReminderRepository,
          useValue: { create: jest.fn(), countByVehicleId: jest.fn() },
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

    useCase = module.get<CreateVehicleReminderUseCase>(CreateVehicleReminderUseCase);
    reminderRepository = module.get(IVehicleReminderRepository);
    vehicleRepository = module.get(IVehicleRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw ForbiddenException if user does not own vehicle', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(false);
      await expect(useCase.execute('v1', createDto, 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute('v1', createDto, 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no date or mileage', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue({} as any);
      const invalidDto: CreateVehicleReminderDto = {
        type: ReminderType.OIL_CHANGE,
        title: 'تغيير زيت',
      };
      await expect(useCase.execute('v1', invalidDto, 'user1')).rejects.toThrow(
        'Either reminderDate or mileageThreshold must be provided',
      );
    });

    it('should throw BadRequestException if max reminders reached', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue({} as any);
      reminderRepository.countByVehicleId.mockResolvedValue(20);
      await expect(useCase.execute('v1', createDto, 'user1')).rejects.toThrow(
        'Maximum number of reminders reached (20)',
      );
    });

    it('should create reminder successfully', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue({} as any);
      reminderRepository.countByVehicleId.mockResolvedValue(2);
      reminderRepository.create.mockResolvedValue(mockReminder as VehicleReminderEntity);

      const result = await useCase.execute('v1', createDto, 'user1');

      expect(reminderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: 'v1',
          userId: 'user1',
          type: ReminderType.OIL_CHANGE,
        }),
      );
      expect(result).toEqual(mockReminder);
    });
  });
});

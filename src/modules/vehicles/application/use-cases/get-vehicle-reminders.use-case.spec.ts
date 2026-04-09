import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GetVehicleRemindersUseCase } from './get-vehicle-reminders.use-case';
import { IVehicleReminderRepository } from '../../domain/repositories/vehicle-reminder.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleReminderEntity, ReminderType } from '../../domain/entities/vehicle-reminder.entity';

describe('GetVehicleRemindersUseCase', () => {
  let useCase: GetVehicleRemindersUseCase;
  let reminderRepository: jest.Mocked<IVehicleReminderRepository>;
  let vehicleRepository: jest.Mocked<IVehicleRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockReminders: VehicleReminderEntity[] = [
    {
      id: 'r1',
      vehicleId: 'v1',
      userId: 'user1',
      type: ReminderType.OIL_CHANGE,
      title: 'تغيير زيت',
      reminderDate: new Date('2025-03-01'),
    } as VehicleReminderEntity,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVehicleRemindersUseCase,
        {
          provide: IVehicleReminderRepository,
          useValue: { findByVehicleId: jest.fn() },
        },
        {
          provide: IVehicleRepository,
          useValue: { belongsToUser: jest.fn(), findById: jest.fn() },
        },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<GetVehicleRemindersUseCase>(GetVehicleRemindersUseCase);
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
      await expect(useCase.execute('v1', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute('v1', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should return cached results if available', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue({} as any);
      const cached = { reminders: mockReminders, pagination: { total: 1, page: 1, limit: 20, pages: 1 } };
      cacheManager.get.mockResolvedValue(cached);

      const result = await useCase.execute('v1', 'user1');

      expect(cacheManager.get).toHaveBeenCalled();
      expect(reminderRepository.findByVehicleId).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });

    it('should fetch reminders and cache', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue({} as any);
      cacheManager.get.mockResolvedValue(null);
      reminderRepository.findByVehicleId.mockResolvedValue({
        reminders: mockReminders,
        total: 1,
      });

      const result = await useCase.execute('v1', 'user1');

      expect(reminderRepository.findByVehicleId).toHaveBeenCalledWith('v1', 0, 20);
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result.reminders).toHaveLength(1);
    });
  });
});

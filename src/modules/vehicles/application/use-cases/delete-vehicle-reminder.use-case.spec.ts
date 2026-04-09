import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DeleteVehicleReminderUseCase } from './delete-vehicle-reminder.use-case';
import { IVehicleReminderRepository } from '../../domain/repositories/vehicle-reminder.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleReminderEntity, ReminderType } from '../../domain/entities/vehicle-reminder.entity';

describe('DeleteVehicleReminderUseCase', () => {
  let useCase: DeleteVehicleReminderUseCase;
  let reminderRepository: jest.Mocked<IVehicleReminderRepository>;
  let vehicleRepository: jest.Mocked<IVehicleRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockReminder: VehicleReminderEntity = {
    id: 'r1',
    vehicleId: 'v1',
    userId: 'user1',
    type: ReminderType.OIL_CHANGE,
    title: 'تغيير زيت',
  } as VehicleReminderEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteVehicleReminderUseCase,
        {
          provide: IVehicleReminderRepository,
          useValue: { findById: jest.fn(), delete: jest.fn() },
        },
        {
          provide: IVehicleRepository,
          useValue: { belongsToUser: jest.fn() },
        },
        {
          provide: CACHE_MANAGER,
          useValue: { del: jest.fn(), store: { keys: jest.fn().mockResolvedValue([]) } },
        },
      ],
    }).compile();

    useCase = module.get<DeleteVehicleReminderUseCase>(DeleteVehicleReminderUseCase);
    reminderRepository = module.get(IVehicleReminderRepository);
    vehicleRepository = module.get(IVehicleRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw NotFoundException if reminder not found', async () => {
      reminderRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute('r1', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own vehicle', async () => {
      reminderRepository.findById.mockResolvedValue(mockReminder);
      vehicleRepository.belongsToUser.mockResolvedValue(false);
      await expect(useCase.execute('r1', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete reminder successfully', async () => {
      reminderRepository.findById.mockResolvedValue(mockReminder);
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      reminderRepository.delete.mockResolvedValue(true);

      await useCase.execute('r1', 'user1');

      expect(reminderRepository.delete).toHaveBeenCalledWith('r1');
    });
  });
});

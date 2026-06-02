import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { Notification } from '../../../../modules/notifications/infrastructure/persistence/mongoose/schemas/notification.schema';
import { NotificationsGateway } from '../../presentation/gateways/notifications.gateway';
import { Types } from 'mongoose';

describe('NotificationsService (Unit Audit)', () => {
  let service: NotificationsService;

  const mockNotificationModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    countDocuments: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    updateMany: jest.fn().mockReturnThis(),
  };

  const mockGateway = {
    sendToUser: jest.fn(),
    emitUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getModelToken(Notification.name), useValue: mockNotificationModel },
        { provide: NotificationsGateway, useValue: mockGateway },
        { provide: getConnectionToken(), useValue: {} },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should get unread count correctly', async () => {
    const userId = new Types.ObjectId().toString();
    mockNotificationModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(5)
    });

    const count = await service.getUnreadCount(userId);
    expect(count).toBe(5);
    expect(mockNotificationModel.countDocuments).toHaveBeenCalledWith({
      recipientId: new Types.ObjectId(userId),
      isRead: false
    });
  });

  it('should verify ownership when marking as read', async () => {
    const userId = new Types.ObjectId().toString();
    const notificationId = new Types.ObjectId().toString();
    
    // Mock the chain findOneAndUpdate().exec()
    mockNotificationModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: notificationId })
    });
    // Mock countDocuments for the subsequent emit
    mockNotificationModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0)
    });

    await service.markAsRead(notificationId, userId);

    expect(mockNotificationModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: new Types.ObjectId(notificationId), recipientId: new Types.ObjectId(userId) }),
      expect.any(Object),
      expect.any(Object)
    );
  });
});

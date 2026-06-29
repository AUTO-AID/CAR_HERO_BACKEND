import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
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
    updateOne: jest.fn().mockReturnThis(),
    insertMany: jest.fn(),
    aggregate: jest.fn().mockReturnThis(),
  };

  const mockGateway = {
    sendToUser: jest.fn(),
    emitUnreadCount: jest.fn(),
  };

  const collectionMocks = {
    users: {
      findOne: jest.fn(),
    },
    admins: {
      findOne: jest.fn(),
    },
    providers: {
      findOne: jest.fn(),
      find: jest.fn(),
    },
  };

  const mockConnection = {
    collection: jest.fn((name: keyof typeof collectionMocks) => collectionMocks[name]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getModelToken(Notification.name), useValue: mockNotificationModel },
        { provide: NotificationsGateway, useValue: mockGateway },
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
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
      isRead: false,
      deliveryStatus: { $ne: 'scheduled' },
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

  it('should create and deliver an admin notification to the admin room', async () => {
    const adminId = new Types.ObjectId();
    const notification = {
      _id: new Types.ObjectId(),
      recipientId: adminId,
      recipientType: 'admin',
      title: 'New Provider Registration',
      body: 'A provider is waiting for approval.',
      type: 'alert',
      data: { event: 'provider.registration.pending' },
    };

    collectionMocks.admins.findOne.mockResolvedValue({ _id: adminId, isActive: true });
    mockNotificationModel.create.mockResolvedValue(notification);
    mockNotificationModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    const result = await service.createNotification({
      recipientId: adminId.toString(),
      recipientType: 'admin',
      title: notification.title,
      body: notification.body,
      type: notification.type as any,
      data: notification.data,
    });

    expect(result).toBe(notification);
    expect(mockConnection.collection).toHaveBeenCalledWith('admins');
    expect(collectionMocks.admins.findOne).toHaveBeenCalledWith({
      _id: adminId,
      isActive: { $ne: false },
    });
    expect(mockNotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({
      recipientId: adminId,
      recipientType: 'admin',
      data: { event: 'provider.registration.pending' },
    }));
    expect(mockGateway.sendToUser).toHaveBeenCalledWith(adminId.toString(), notification);
    expect(mockGateway.emitUnreadCount).toHaveBeenCalledWith(adminId.toString(), 1);
  });
});

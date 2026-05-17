import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Chat, Message } from '../../infrastructure/persistence/mongoose/schemas/chat.schema';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { OrderEntity } from '../../../orders/domain/entities/order.entity';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { MessageType } from '../dtos/chat.dto';
import { Types } from 'mongoose';

describe('Chat Module: Security & Integration Audit', () => {
  let service: ChatService;
  
  const mockChatModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
  }));
  mockChatModel.findOne = jest.fn();
  mockChatModel.findById = jest.fn();
  mockChatModel.find = jest.fn();
  mockChatModel.updateMany = jest.fn();

  const mockMessageModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
  }));
  mockMessageModel.find = jest.fn();
  mockMessageModel.countDocuments = jest.fn();
  mockMessageModel.updateMany = jest.fn();

  const mockOrderRepo = {
    findById: jest.fn(),
  };

  const mockNotificationsService = {
    sendChatNotification: jest.fn(),
    createNotification: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getModelToken(Chat.name), useValue: mockChatModel },
        { provide: getModelToken(Message.name), useValue: mockMessageModel },
        { provide: Symbol.for('IOrderRepository'), useValue: mockOrderRepo },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SECURITY: Chat Creation & Participant Validation', () => {
    it('SHOULD allow creating chat only for valid Order participants', async () => {
      const userId = new Types.ObjectId().toString();
      const providerId = new Types.ObjectId().toString();
      const orderId = new Types.ObjectId().toString();

      const mockOrder = new OrderEntity(
        orderId, 'ORD-001', userId, 'service1', OrderStatus.ACCEPTED, 100,
        { type: 'Point', coordinates: [0, 0] }, providerId
      );

      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      mockChatModel.findOne.mockResolvedValue(null);
      
      const result = await service.getOrCreateChat(userId, providerId, orderId);
      expect(result).toBeDefined();
      expect(mockChatModel.findOne).toHaveBeenCalled();
    });

    it('SHOULD throw ForbiddenException if participant is NOT on the Order', async () => {
      const userId = new Types.ObjectId().toString();
      const attackerId = new Types.ObjectId().toString();
      const orderId = new Types.ObjectId().toString();

      const mockOrder = new OrderEntity(
        orderId, 'ORD-001', userId, 'service1', OrderStatus.ACCEPTED, 100,
        { type: 'Point', coordinates: [0, 0] }, new Types.ObjectId().toString()
      );

      mockOrderRepo.findById.mockResolvedValue(mockOrder);

      await expect(service.getOrCreateChat(userId, attackerId, orderId))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('SECURITY: Message Privacy', () => {
    it('SHOULD prevent non-participants from sending messages', async () => {
      const chatId = new Types.ObjectId();
      const attackerId = new Types.ObjectId().toString();

      mockChatModel.findById.mockResolvedValue({
        _id: chatId,
        participants: [new Types.ObjectId(), new Types.ObjectId()],
      });

      await expect(service.saveMessage(attackerId, { 
        chatId: chatId.toString(), message: 'I see you', type: MessageType.TEXT 
      })).rejects.toThrow(ForbiddenException);
    });

    it('SHOULD allow participants to send messages and update unread count', async () => {
        const userId = new Types.ObjectId();
        const receiverId = new Types.ObjectId();
        const chatId = new Types.ObjectId();
  
        const mockChat = {
          _id: chatId,
          participants: [userId, receiverId],
          unreadCounts: new Map(),
          save: jest.fn().mockResolvedValue(true),
        };
  
        mockChatModel.findById.mockResolvedValue(mockChat);
        
        await service.saveMessage(userId.toString(), {
          chatId: chatId.toString(),
          message: 'Hello',
          type: MessageType.TEXT
        });
  
        expect(mockChat.unreadCounts.get(receiverId.toString())).toBe(1);
        expect(mockChat.save).toHaveBeenCalled();
      });
  });

  describe('SECURITY: Gateway Room Protection', () => {
    it('verifyMembership SHOULD return false for unauthorized users', async () => {
        const chatId = new Types.ObjectId().toString();
        const userId = new Types.ObjectId().toString();
        const attackerId = new Types.ObjectId().toString();

        mockChatModel.findById.mockResolvedValue({
            participants: [new Types.ObjectId(userId), new Types.ObjectId()]
        });

        const isMember = await service.verifyMembership(chatId, userId);
        const isAttackerMember = await service.verifyMembership(chatId, attackerId);

        expect(isMember).toBe(true);
        expect(isAttackerMember).toBe(false);
    });
  });
});

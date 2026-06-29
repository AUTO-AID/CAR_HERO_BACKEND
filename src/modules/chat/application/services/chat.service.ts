import { Injectable, NotFoundException, ForbiddenException, Inject, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument, Message, MessageDocument } from '../../infrastructure/persistence/mongoose/schemas/chat.schema';
import { MessageType, SendMessageDto } from '../dtos/chat.dto';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { NotificationType } from '../../../../core/enums/status.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @Inject(IOrderRepository) private readonly orderRepository: IOrderRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getOrCreateChat(userId: string, targetId: string, orderId: string): Promise<ChatDocument> {
    if (!orderId) {
      throw new BadRequestException('Order ID is required to start a chat');
    }
    if (userId === targetId) {
      throw new BadRequestException('Cannot start a chat with yourself');
    }

    // SECURITY: Validate participant link to Order
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    
    const participantsOnOrder = [order.userId, order.providerId].filter(id => !!id);
    if (!participantsOnOrder.includes(userId) || !participantsOnOrder.includes(targetId)) {
      throw new ForbiddenException('Participants are not linked to this order');
    }

    // Look for existing 1-on-1 chat for this specific order
    let chat = await this.chatModel.findOne({
      participants: { $all: [new Types.ObjectId(userId), new Types.ObjectId(targetId)] },
      orderId: new Types.ObjectId(orderId)
    });

    if (!chat) {
      chat = new this.chatModel({
        participants: [new Types.ObjectId(userId), new Types.ObjectId(targetId)],
        orderId: new Types.ObjectId(orderId),
        unreadCounts: new Map(),
      });
      await chat.save();
    }

    return chat;
  }

  async saveMessage(senderId: string, dto: SendMessageDto): Promise<MessageDocument> {
    const chat = await this.chatModel.findById(dto.chatId);
    if (!chat) throw new NotFoundException('Chat not found');

    // SECURITY: Verify sender is participant
    if (!chat.participants.map(p => p.toString()).includes(senderId)) {
      throw new ForbiddenException('Not a participant of this chat');
    }

    let receiverId = chat.participants.find(p => p.toString() !== senderId);
    if (!receiverId) {
      // In case a user chats with themselves (edge case prevented now, but safe fallback)
      receiverId = new Types.ObjectId(senderId);
    }

    const message = new this.messageModel({
      chatId: new Types.ObjectId(dto.chatId),
      senderId: new Types.ObjectId(senderId),
      receiverId: receiverId,
      message: dto.message,
      type: dto.type || MessageType.TEXT,
      fileUrl: dto.fileUrl,
      location: dto.location,
    });

    const savedMessage = await message.save();

    // Update Chat last message and unread counts atomically to prevent race conditions
    const receiverIdStr = receiverId.toString();
    const updatePath = `unreadCounts.${receiverIdStr}`;
    
    await this.chatModel.updateOne(
      { _id: new Types.ObjectId(dto.chatId) },
      { 
        $set: { 
          lastMessage: dto.message, 
          lastMessageAt: new Date(), 
          lastMessageBy: new Types.ObjectId(senderId) 
        },
        $inc: { [updatePath]: 1 }
      }
    );

    // Notify the receiver through the unified notification pipeline.
    await this.notificationsService.createNotification({
      recipientId: receiverId.toString(),
      recipientType: 'user', // Adjust if you have complex roles
      title: 'New message',
      body: dto.message.length > 50 ? `${dto.message.substring(0, 50)}...` : dto.message,
      type: NotificationType.NEW_MESSAGE,
      data: { chatId: chat.id, senderId }
    });

    return savedMessage;
  }

  async getMessages(chatId: string, userId: string, page: number = 1, limit: number = 20): Promise<{ messages: MessageDocument[], total: number }> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    
    // SECURITY: Verify membership
    if (!chat.participants.map(p => p.toString()).includes(userId)) {
      throw new ForbiddenException('Access denied');
    }

    const [messages, total] = await Promise.all([
      this.messageModel.find({ chatId: new Types.ObjectId(chatId) })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments({ chatId: new Types.ObjectId(chatId) }),
    ]);

    return { messages, total };
  }

  async verifyMembership(chatId: string, userId: string): Promise<boolean> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) return false;
    return chat.participants.map(p => p.toString()).includes(userId);
  }

  async getUserChats(userId: string): Promise<ChatDocument[]> {
    return this.chatModel.find({
      participants: new Types.ObjectId(userId),
      isActive: true,
    })
    .sort({ lastMessageAt: -1 })
    .exec();
  }

  async markAsRead(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) return;

    // SECURITY: Verify membership
    if (!chat.participants.map(p => p.toString()).includes(userId)) return;

    // Reset unread count for this user atomically
    const updatePath = `unreadCounts.${userId}`;
    await this.chatModel.updateOne(
      { _id: new Types.ObjectId(chatId) },
      { $set: { [updatePath]: 0 } }
    );

    // Mark messages as read
    await this.messageModel.updateMany(
      { chatId: new Types.ObjectId(chatId), receiverId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }
}

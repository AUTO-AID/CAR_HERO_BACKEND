import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
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

  async getOrCreateChat(userId: string, targetId: string, orderId?: string): Promise<ChatDocument> {
    // SECURITY: Validate participant link to Order
    if (orderId) {
      const order = await this.orderRepository.findById(orderId);
      if (!order) throw new NotFoundException('Order not found');
      
      const participantsOnOrder = [order.userId, order.providerId].filter(id => !!id);
      if (!participantsOnOrder.includes(userId) || !participantsOnOrder.includes(targetId)) {
        throw new ForbiddenException('Participants are not linked to this order');
      }
    }

    // Look for existing 1-on-1 chat
    let chat = await this.chatModel.findOne({
      participants: { $all: [new Types.ObjectId(userId), new Types.ObjectId(targetId)] },
      orderId: orderId ? new Types.ObjectId(orderId) : { $exists: false }
    });

    if (!chat) {
      chat = new this.chatModel({
        participants: [new Types.ObjectId(userId), new Types.ObjectId(targetId)],
        orderId: orderId ? new Types.ObjectId(orderId) : undefined,
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

    const receiverId = chat.participants.find(p => p.toString() !== senderId);
    if (!receiverId) throw new Error('Receiver not found in chat');

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

    // Update Chat last message and unread counts
    chat.lastMessage = dto.message;
    chat.lastMessageAt = new Date();
    chat.lastMessageBy = new Types.ObjectId(senderId);
    
    // Increment unread for receiver
    const currentUnread = chat.unreadCounts.get(receiverId.toString()) || 0;
    chat.unreadCounts.set(receiverId.toString(), currentUnread + 1);
    
    await chat.save();

    // 📣 Notify receiver
    await this.notificationsService.createNotification({
      recipientId: receiverId.toString(),
      recipientType: 'user', // Adjust if you have complex roles
      title: 'New Message 💬',
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

    // Reset unread count for this user
    chat.unreadCounts.set(userId, 0);
    await chat.save();

    // Mark messages as read
    await this.messageModel.updateMany(
      { chatId: new Types.ObjectId(chatId), receiverId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }
}

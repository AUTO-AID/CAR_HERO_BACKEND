import { Model } from 'mongoose';
import { ChatDocument } from '../../../../modules/chat/infrastructure/persistence/mongoose/schemas/chat.schema';
import { SendMessageDto } from './dto/chat.dto';
import type { IOrderRepository } from '../orders/domain/repositories/order.repository.interface';
import type { IBookingRepository } from '../bookings/domain/repositories/booking.repository.interface';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ChatService {
    private readonly chatModel;
    private readonly messageModel;
    private readonly orderRepository;
    private readonly bookingRepository;
    private readonly notificationsService;
    constructor(chatModel: Model<ChatDocument>, messageModel: Model<MessageDocument>, orderRepository: IOrderRepository, bookingRepository: IBookingRepository, notificationsService: NotificationsService);
    getOrCreateChat(userId: string, targetId: string, orderId?: string): Promise<ChatDocument>;
    saveMessage(senderId: string, dto: SendMessageDto): Promise<MessageDocument>;
    getMessages(chatId: string, userId: string, page?: number, limit?: number): Promise<{
        messages: MessageDocument[];
        total: number;
    }>;
    verifyMembership(chatId: string, userId: string): Promise<boolean>;
    getUserChats(userId: string): Promise<ChatDocument[]>;
    markAsRead(chatId: string, userId: string): Promise<void>;
}

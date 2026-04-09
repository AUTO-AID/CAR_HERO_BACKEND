"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chat_schema_1 = require("../../database/schemas/chat.schema");
const notifications_service_1 = require("../notifications/notifications.service");
const status_enum_1 = require("../../common/enums/status.enum");
let ChatService = class ChatService {
    chatModel;
    messageModel;
    orderRepository;
    bookingRepository;
    notificationsService;
    constructor(chatModel, messageModel, orderRepository, bookingRepository, notificationsService) {
        this.chatModel = chatModel;
        this.messageModel = messageModel;
        this.orderRepository = orderRepository;
        this.bookingRepository = bookingRepository;
        this.notificationsService = notificationsService;
    }
    async getOrCreateChat(userId, targetId, orderId) {
        if (orderId) {
            const order = await this.orderRepository.findById(orderId);
            if (!order)
                throw new common_1.NotFoundException('Order not found');
            const participantsOnOrder = [order.userId, order.providerId].filter(id => !!id);
            if (!participantsOnOrder.includes(userId) || !participantsOnOrder.includes(targetId)) {
                throw new common_1.ForbiddenException('Participants are not linked to this order');
            }
        }
        else {
        }
        let chat = await this.chatModel.findOne({
            participants: { $all: [new mongoose_2.Types.ObjectId(userId), new mongoose_2.Types.ObjectId(targetId)] },
            orderId: orderId ? new mongoose_2.Types.ObjectId(orderId) : { $exists: false }
        });
        if (!chat) {
            chat = new this.chatModel({
                participants: [new mongoose_2.Types.ObjectId(userId), new mongoose_2.Types.ObjectId(targetId)],
                orderId: orderId ? new mongoose_2.Types.ObjectId(orderId) : undefined,
                unreadCounts: new Map(),
            });
            await chat.save();
        }
        return chat;
    }
    async saveMessage(senderId, dto) {
        const chat = await this.chatModel.findById(dto.chatId);
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        if (!chat.participants.map(p => p.toString()).includes(senderId)) {
            throw new common_1.ForbiddenException('Not a participant of this chat');
        }
        const receiverId = chat.participants.find(p => p.toString() !== senderId);
        if (!receiverId)
            throw new Error('Receiver not found in chat');
        const message = new this.messageModel({
            chatId: new mongoose_2.Types.ObjectId(dto.chatId),
            senderId: new mongoose_2.Types.ObjectId(senderId),
            receiverId: receiverId,
            message: dto.message,
            type: dto.type || chat_schema_1.MessageType.TEXT,
            fileUrl: dto.fileUrl,
            location: dto.location,
        });
        const savedMessage = await message.save();
        chat.lastMessage = dto.message;
        chat.lastMessageAt = new Date();
        chat.lastMessageBy = new mongoose_2.Types.ObjectId(senderId);
        const currentUnread = chat.unreadCounts.get(receiverId.toString()) || 0;
        chat.unreadCounts.set(receiverId.toString(), currentUnread + 1);
        await chat.save();
        await this.notificationsService.createNotification({
            recipientId: receiverId.toString(),
            recipientType: 'user',
            title: 'New Message 💬',
            body: dto.message.length > 50 ? `${dto.message.substring(0, 50)}...` : dto.message,
            type: status_enum_1.NotificationType.NEW_MESSAGE,
            data: { chatId: chat.id, senderId }
        });
        return savedMessage;
    }
    async getMessages(chatId, userId, page = 1, limit = 20) {
        const chat = await this.chatModel.findById(chatId);
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        if (!chat.participants.map(p => p.toString()).includes(userId)) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const [messages, total] = await Promise.all([
            this.messageModel.find({ chatId: new mongoose_2.Types.ObjectId(chatId) })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec(),
            this.messageModel.countDocuments({ chatId: new mongoose_2.Types.ObjectId(chatId) }),
        ]);
        return { messages, total };
    }
    async verifyMembership(chatId, userId) {
        const chat = await this.chatModel.findById(chatId);
        if (!chat)
            return false;
        return chat.participants.map(p => p.toString()).includes(userId);
    }
    async getUserChats(userId) {
        return this.chatModel.find({
            participants: new mongoose_2.Types.ObjectId(userId),
            isActive: true,
        })
            .sort({ lastMessageAt: -1 })
            .exec();
    }
    async markAsRead(chatId, userId) {
        const chat = await this.chatModel.findById(chatId);
        if (!chat)
            return;
        if (!chat.participants.map(p => p.toString()).includes(userId))
            return;
        chat.unreadCounts.set(userId, 0);
        await chat.save();
        await this.messageModel.updateMany({ chatId: new mongoose_2.Types.ObjectId(chatId), receiverId: new mongoose_2.Types.ObjectId(userId), isRead: false }, { $set: { isRead: true, readAt: new Date() } });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(chat_schema_1.Chat.name)),
    __param(1, (0, mongoose_1.InjectModel)(chat_schema_1.Message.name)),
    __param(2, (0, common_1.Inject)(Symbol.for('IOrderRepository'))),
    __param(3, (0, common_1.Inject)('IBookingRepository')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model, Object, Object, notifications_service_1.NotificationsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map
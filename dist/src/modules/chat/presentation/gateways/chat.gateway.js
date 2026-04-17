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
var ChatGateway_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const ws_jwt_guard_1 = require("../../core/guards/ws-jwt.guard");
const chat_service_1 = require("./chat.service");
const chat_dto_1 = require("./dto/chat.dto");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    chatService;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    onlineUsers = new Map();
    constructor(chatService) {
        this.chatService = chatService;
    }
    async handleConnection(client) {
        this.logger.log(`Chat client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        for (const [userId, socketId] of this.onlineUsers.entries()) {
            if (socketId === client.id) {
                this.onlineUsers.delete(userId);
                this.server.emit('user_offline', { userId });
                break;
            }
        }
    }
    async handleJoinChat(client, data) {
        const userId = client.data.user.id;
        const isMember = await this.chatService.verifyMembership(data.chatId, userId);
        if (!isMember) {
            throw new websockets_1.WsException('Unauthorized: You are not a participant of this chat');
        }
        client.join(`chat:${data.chatId}`);
        this.onlineUsers.set(userId, client.id);
        this.server.emit('user_online', { userId });
        return { success: true, roomId: `chat:${data.chatId}` };
    }
    handleLeaveChat(client, data) {
        client.leave(`chat:${data.chatId}`);
        return { success: true };
    }
    async handleSendMessage(client, dto) {
        const userId = client.data.user.id;
        const message = await this.chatService.saveMessage(userId, dto);
        const roomId = `chat:${dto.chatId}`;
        this.server.to(roomId).emit('new_message', message);
        return { success: true, messageId: message._id.toString() };
    }
    async handleTyping(client, data) {
        const userId = client.data.user.id;
        const isMember = await this.chatService.verifyMembership(data.chatId, userId);
        if (!isMember)
            return;
        const roomId = `chat:${data.chatId}`;
        client.to(roomId).emit('user_typing', {
            chatId: data.chatId,
            userId,
            isTyping: data.isTyping,
        });
    }
    async handleMessageRead(client, data) {
        const userId = client.data.user.id;
        await this.chatService.markAsRead(data.chatId, userId);
        const roomId = `chat:${data.chatId}`;
        this.server.to(roomId).emit('messages_marked_read', {
            chatId: data.chatId,
            userId,
        });
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('join_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinChat", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('leave_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveChat", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, typeof (_b = typeof chat_dto_1.SendMessageDto !== "undefined" && chat_dto_1.SendMessageDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('message_read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessageRead", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: 'chat',
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof chat_service_1.ChatService !== "undefined" && chat_service_1.ChatService) === "function" ? _a : Object])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map
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
var AppGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppGateway = exports.ClientEvents = exports.ServerEvents = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
var ServerEvents;
(function (ServerEvents) {
    ServerEvents["ORDER_STATUS_UPDATED"] = "order:status:updated";
    ServerEvents["ORDER_LOCATION_UPDATED"] = "order:location:updated";
    ServerEvents["ORDER_NEW"] = "order:new";
    ServerEvents["ORDER_ASSIGNED"] = "order:assigned";
    ServerEvents["MESSAGE_NEW"] = "message:new";
    ServerEvents["MESSAGE_READ"] = "message:read";
    ServerEvents["TYPING_START"] = "typing:start";
    ServerEvents["TYPING_STOP"] = "typing:stop";
    ServerEvents["PROVIDER_ONLINE"] = "provider:online";
    ServerEvents["PROVIDER_OFFLINE"] = "provider:offline";
    ServerEvents["PROVIDER_LOCATION_UPDATED"] = "provider:location:updated";
    ServerEvents["ERROR"] = "error";
    ServerEvents["CONNECTED"] = "connected";
})(ServerEvents || (exports.ServerEvents = ServerEvents = {}));
var ClientEvents;
(function (ClientEvents) {
    ClientEvents["JOIN_ORDER"] = "join:order";
    ClientEvents["LEAVE_ORDER"] = "leave:order";
    ClientEvents["JOIN_CHAT"] = "join:chat";
    ClientEvents["LEAVE_CHAT"] = "leave:chat";
    ClientEvents["UPDATE_ORDER_STATUS"] = "update:order:status";
    ClientEvents["UPDATE_ORDER_LOCATION"] = "update:order:location";
    ClientEvents["SEND_MESSAGE"] = "send:message";
    ClientEvents["MARK_READ"] = "mark:read";
    ClientEvents["START_TYPING"] = "start:typing";
    ClientEvents["STOP_TYPING"] = "stop:typing";
    ClientEvents["UPDATE_PROVIDER_STATUS"] = "update:provider:status";
    ClientEvents["UPDATE_PROVIDER_LOCATION"] = "update:provider:location";
})(ClientEvents || (exports.ClientEvents = ClientEvents = {}));
let AppGateway = AppGateway_1 = class AppGateway {
    server;
    logger = new common_1.Logger(AppGateway_1.name);
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        try {
            this.logger.log(`Client connected: ${client.id}`);
            client.emit(ServerEvents.CONNECTED, {
                message: 'Connected to Car Hero WebSocket',
                clientId: client.id,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinOrder(client, data) {
        const room = `order:${data.orderId}`;
        client.join(room);
        this.logger.log(`Client ${client.id} joined room ${room}`);
        return { success: true, room };
    }
    handleLeaveOrder(client, data) {
        const room = `order:${data.orderId}`;
        client.leave(room);
        this.logger.log(`Client ${client.id} left room ${room}`);
        return { success: true, room };
    }
    handleJoinChat(client, data) {
        const room = `chat:${data.chatId}`;
        client.join(room);
        this.logger.log(`Client ${client.id} joined chat ${room}`);
        return { success: true, room };
    }
    handleLeaveChat(client, data) {
        const room = `chat:${data.chatId}`;
        client.leave(room);
        this.logger.log(`Client ${client.id} left chat ${room}`);
        return { success: true, room };
    }
    handleOrderStatusUpdate(client, data) {
        const room = `order:${data.orderId}`;
        this.server.to(room).emit(ServerEvents.ORDER_STATUS_UPDATED, {
            orderId: data.orderId,
            status: data.status,
            note: data.note,
            timestamp: new Date().toISOString(),
        });
        return { success: true };
    }
    handleOrderLocationUpdate(client, data) {
        const room = `order:${data.orderId}`;
        this.server.to(room).emit(ServerEvents.ORDER_LOCATION_UPDATED, {
            orderId: data.orderId,
            location: {
                latitude: data.latitude,
                longitude: data.longitude,
            },
            timestamp: new Date().toISOString(),
        });
        return { success: true };
    }
    handleSendMessage(client, data) {
        const room = `chat:${data.chatId}`;
        this.server.to(room).emit(ServerEvents.MESSAGE_NEW, {
            chatId: data.chatId,
            content: data.content,
            type: data.type || 'text',
            senderId: data.senderId,
            senderType: data.senderType,
            timestamp: new Date().toISOString(),
        });
        return { success: true };
    }
    handleStartTyping(client, data) {
        const room = `chat:${data.chatId}`;
        client.to(room).emit(ServerEvents.TYPING_START, {
            chatId: data.chatId,
            userId: data.userId,
        });
        return { success: true };
    }
    handleStopTyping(client, data) {
        const room = `chat:${data.chatId}`;
        client.to(room).emit(ServerEvents.TYPING_STOP, {
            chatId: data.chatId,
            userId: data.userId,
        });
        return { success: true };
    }
    handleProviderLocationUpdate(client, data) {
        this.server.emit(ServerEvents.PROVIDER_LOCATION_UPDATED, {
            providerId: data.providerId,
            location: {
                latitude: data.latitude,
                longitude: data.longitude,
            },
            timestamp: new Date().toISOString(),
        });
        return { success: true };
    }
    emitOrderStatusUpdate(orderId, status, data) {
        const room = `order:${orderId}`;
        this.server.to(room).emit(ServerEvents.ORDER_STATUS_UPDATED, {
            orderId,
            status,
            ...data,
            timestamp: new Date().toISOString(),
        });
    }
    emitNewOrder(order) {
        this.server.emit(ServerEvents.ORDER_NEW, {
            order,
            timestamp: new Date().toISOString(),
        });
    }
    emitNewMessage(chatId, message) {
        const room = `chat:${chatId}`;
        this.server.to(room).emit(ServerEvents.MESSAGE_NEW, {
            ...message,
            timestamp: new Date().toISOString(),
        });
    }
    emitProviderStatus(providerId, isOnline) {
        const event = isOnline ? ServerEvents.PROVIDER_ONLINE : ServerEvents.PROVIDER_OFFLINE;
        this.server.emit(event, {
            providerId,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.AppGateway = AppGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AppGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(ClientEvents.JOIN_ORDER),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleJoinOrder", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ClientEvents.LEAVE_ORDER),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleLeaveOrder", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ClientEvents.JOIN_CHAT),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleJoinChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ClientEvents.LEAVE_CHAT),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleLeaveChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ClientEvents.UPDATE_ORDER_STATUS),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleOrderStatusUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ClientEvents.UPDATE_ORDER_LOCATION),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleOrderLocationUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ClientEvents.SEND_MESSAGE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ClientEvents.START_TYPING),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleStartTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ClientEvents.STOP_TYPING),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleStopTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ClientEvents.UPDATE_PROVIDER_LOCATION),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleProviderLocationUpdate", null);
exports.AppGateway = AppGateway = AppGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/ws',
    })
], AppGateway);
//# sourceMappingURL=app.gateway.js.map
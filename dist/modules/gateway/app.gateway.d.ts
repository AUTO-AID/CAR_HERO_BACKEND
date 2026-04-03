import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare enum ServerEvents {
    ORDER_STATUS_UPDATED = "order:status:updated",
    ORDER_LOCATION_UPDATED = "order:location:updated",
    ORDER_NEW = "order:new",
    ORDER_ASSIGNED = "order:assigned",
    MESSAGE_NEW = "message:new",
    MESSAGE_READ = "message:read",
    TYPING_START = "typing:start",
    TYPING_STOP = "typing:stop",
    PROVIDER_ONLINE = "provider:online",
    PROVIDER_OFFLINE = "provider:offline",
    PROVIDER_LOCATION_UPDATED = "provider:location:updated",
    ERROR = "error",
    CONNECTED = "connected"
}
export declare enum ClientEvents {
    JOIN_ORDER = "join:order",
    LEAVE_ORDER = "leave:order",
    JOIN_CHAT = "join:chat",
    LEAVE_CHAT = "leave:chat",
    UPDATE_ORDER_STATUS = "update:order:status",
    UPDATE_ORDER_LOCATION = "update:order:location",
    SEND_MESSAGE = "send:message",
    MARK_READ = "mark:read",
    START_TYPING = "start:typing",
    STOP_TYPING = "stop:typing",
    UPDATE_PROVIDER_STATUS = "update:provider:status",
    UPDATE_PROVIDER_LOCATION = "update:provider:location"
}
export declare class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    afterInit(server: Server): void;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinOrder(client: Socket, data: {
        orderId: string;
    }): {
        success: boolean;
        room: string;
    };
    handleLeaveOrder(client: Socket, data: {
        orderId: string;
    }): {
        success: boolean;
        room: string;
    };
    handleJoinChat(client: Socket, data: {
        chatId: string;
    }): {
        success: boolean;
        room: string;
    };
    handleLeaveChat(client: Socket, data: {
        chatId: string;
    }): {
        success: boolean;
        room: string;
    };
    handleOrderStatusUpdate(client: Socket, data: {
        orderId: string;
        status: string;
        note?: string;
    }): {
        success: boolean;
    };
    handleOrderLocationUpdate(client: Socket, data: {
        orderId: string;
        latitude: number;
        longitude: number;
    }): {
        success: boolean;
    };
    handleSendMessage(client: Socket, data: {
        chatId: string;
        content: string;
        type?: string;
        senderId: string;
        senderType: string;
    }): {
        success: boolean;
    };
    handleStartTyping(client: Socket, data: {
        chatId: string;
        userId: string;
    }): {
        success: boolean;
    };
    handleStopTyping(client: Socket, data: {
        chatId: string;
        userId: string;
    }): {
        success: boolean;
    };
    handleProviderLocationUpdate(client: Socket, data: {
        providerId: string;
        latitude: number;
        longitude: number;
    }): {
        success: boolean;
    };
    emitOrderStatusUpdate(orderId: string, status: string, data?: any): void;
    emitNewOrder(order: any): void;
    emitNewMessage(chatId: string, message: any): void;
    emitProviderStatus(providerId: string, isOnline: boolean): void;
}

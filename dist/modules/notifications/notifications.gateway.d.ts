import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinNotifications(client: Socket): {
        success: boolean;
        room: string;
    };
    sendToUser(userId: string, payload: any): void;
    emitUnreadCount(userId: string, count: number): void;
}

import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    server: Server;
    private readonly logger;
    private onlineUsers;
    constructor(chatService: ChatService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinChat(client: Socket, data: {
        chatId: string;
    }): Promise<{
        success: boolean;
        roomId: string;
    }>;
    handleLeaveChat(client: Socket, data: {
        chatId: string;
    }): {
        success: boolean;
    };
    handleSendMessage(client: Socket, dto: SendMessageDto): Promise<{
        success: boolean;
        messageId: any;
    }>;
    handleTyping(client: Socket, data: {
        chatId: string;
        isTyping: boolean;
    }): Promise<void>;
    handleMessageRead(client: Socket, data: {
        chatId: string;
    }): Promise<void>;
}

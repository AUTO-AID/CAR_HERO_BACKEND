import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Chat client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        this.onlineUsers.delete(userId);
        this.server.emit('user_offline', { userId });
        break;
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.user.id;
    
    // SECURITY: Verify membership before joining room
    const isMember = await this.chatService.verifyMembership(data.chatId, userId);
    if (!isMember) {
      throw new WsException('Unauthorized: You are not a participant of this chat');
    }

    client.join(`chat:${data.chatId}`);
    
    // Register online status
    this.onlineUsers.set(userId, client.id);
    this.server.emit('user_online', { userId });
    
    return { success: true, roomId: `chat:${data.chatId}` };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave_chat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    client.leave(`chat:${data.chatId}`);
    return { success: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const userId = client.data.user.id;
    // Security check is done inside saveMessage
    const message = await this.chatService.saveMessage(userId, dto);
    
    const roomId = `chat:${dto.chatId}`;
    this.server.to(roomId).emit('new_message', message);
    
    return { success: true, messageId: (message as any)._id.toString() };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const userId = client.data.user.id;
    
    // SECURITY: Optional: check membership for typing too
    const isMember = await this.chatService.verifyMembership(data.chatId, userId);
    if (!isMember) return;

    const roomId = `chat:${data.chatId}`;
    client.to(roomId).emit('user_typing', {
      chatId: data.chatId,
      userId,
      isTyping: data.isTyping,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message_read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.user.id;
    await this.chatService.markAsRead(data.chatId, userId);
    
    const roomId = `chat:${data.chatId}`;
    this.server.to(roomId).emit('messages_marked_read', {
      chatId: data.chatId,
      userId,
    });
  }
}

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
import { WsJwtGuard } from '../../../../core/guards/ws-jwt.guard';
import { ChatService } from '../../application/services/chat.service';
import { SendMessageDto } from '../../application/dtos/chat.dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(private readonly chatService: ChatService) {}

  private roomFor(chatId: string) {
    return `chat:${chatId}`;
  }

  private async assertMembership(chatId: string, userId: string) {
    const isMember = await this.chatService.verifyMembership(chatId, userId);
    if (!isMember) {
      throw new WsException('Unauthorized: You are not a participant of this chat');
    }
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Chat client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    for (const [userId, sockets] of this.onlineUsers.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(userId);
          this.server.emit('user_offline', { userId });
        }
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
    await this.assertMembership(data.chatId, userId);

    const roomId = this.roomFor(data.chatId);
    client.join(roomId);
    
    // Register online status
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set<string>());
    }
    const sockets = this.onlineUsers.get(userId);
    sockets?.add(client.id);
    this.server.emit('user_online', { userId });
    
    return { success: true, roomId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave_chat')
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.user.id;
    await this.assertMembership(data.chatId, userId);

    const roomId = this.roomFor(data.chatId);
    client.leave(roomId);
    return { success: true, roomId };
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
    
    const roomId = this.roomFor(dto.chatId);
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
    await this.assertMembership(data.chatId, userId);

    const roomId = this.roomFor(data.chatId);
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
    await this.assertMembership(data.chatId, userId);

    await this.chatService.markAsRead(data.chatId, userId);
    
    const roomId = this.roomFor(data.chatId);
    this.server.to(roomId).emit('messages_marked_read', {
      chatId: data.chatId,
      userId,
    });
  }
}

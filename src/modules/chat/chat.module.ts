/**
 * Chat Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './presentation/controllers/chat.controller';
import { ChatService } from './application/services/chat.service';
import { ChatGateway } from './presentation/gateways/chat.gateway';
import { Chat, ChatSchema, Message, MessageSchema } from './infrastructure/persistence/mongoose/schemas/chat.schema';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    JwtModule.register({}),
    OrdersModule,
    NotificationsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}

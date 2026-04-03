import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, Message } from '../../database/schemas/chat.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<Chat>,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {}
}

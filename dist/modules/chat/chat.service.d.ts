import { Model } from 'mongoose';
import { Chat, Message } from '../../database/schemas/chat.schema';
export declare class ChatService {
    private readonly chatModel;
    private readonly messageModel;
    constructor(chatModel: Model<Chat>, messageModel: Model<Message>);
}

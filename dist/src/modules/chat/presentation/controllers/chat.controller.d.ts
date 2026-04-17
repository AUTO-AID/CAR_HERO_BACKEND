import { ChatService } from '../../application/services/chat.service';
import { CreateChatDto } from '../../application/dtos/chat.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    startConversation(userId: string, dto: CreateChatDto): Promise<{
        success: boolean;
        data: import("../../infrastructure/persistence/mongoose/schemas/chat.schema").ChatDocument;
    }>;
    getMyConversations(userId: string): Promise<{
        success: boolean;
        data: import("../../infrastructure/persistence/mongoose/schemas/chat.schema").ChatDocument[];
    }>;
    getMessages(userId: string, chatId: string, page: number, limit: number): Promise<{
        messages: MessageDocument[];
        total: number;
        success: boolean;
    }>;
    uploadFile(file: Express.Multer.File): Promise<{
        success: boolean;
        fileUrl: string;
    }>;
}

import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/chat.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    startConversation(userId: string, dto: CreateChatDto): Promise<{
        success: boolean;
        data: import("../../database").ChatDocument;
    }>;
    getMyConversations(userId: string): Promise<{
        success: boolean;
        data: import("../../database").ChatDocument[];
    }>;
    getMessages(userId: string, chatId: string, page: number, limit: number): Promise<{
        messages: import("../../database").MessageDocument[];
        total: number;
        success: boolean;
    }>;
    uploadFile(file: Express.Multer.File): Promise<{
        success: boolean;
        fileUrl: string;
    }>;
}

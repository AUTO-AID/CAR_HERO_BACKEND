import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ChatService } from '../../application/services/chat.service';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { CreateChatDto } from '../../application/dtos/chat.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  async startConversation(@CurrentUser('id') userId: string, @Body() dto: CreateChatDto) {
    const chat = await this.chatService.getOrCreateChat(userId, dto.participantId, dto.orderId);
    return { success: true, data: chat };
  }

  @Get('conversations')
  async getMyConversations(@CurrentUser('id') userId: string) {
    const chats = await this.chatService.getUserChats(userId);
    return { success: true, data: chats };
  }

  @Get(':chatId/messages')
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('chatId') chatId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const result = await this.chatService.getMessages(chatId, userId, page || 1, limit || 20);
    return { success: true, ...result };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/chat',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf|doc|docx)$/)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Unsupported file type'), false);
      }
    },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    
    // In a real app, you might return a full URL based on the server address
    const fileUrl = `/uploads/chat/${file.filename}`;
    return { success: true, fileUrl };
  }
}

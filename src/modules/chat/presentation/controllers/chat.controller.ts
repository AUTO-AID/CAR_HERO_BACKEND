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
import { ChatIdentityService } from '../../application/chat-identity';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatIdentity: ChatIdentityService,
  ) {}

  @Post('conversations')
  async startConversation(@CurrentUser() user: any, @Body() dto: CreateChatDto) {
    const chat = await this.chatService.getOrCreateChat(
      await this.chatIdentity.resolve(user),
      dto.participantId,
      dto.orderId,
    );
    return { success: true, data: chat };
  }

  @Get('conversations')
  async getMyConversations(@CurrentUser() user: any) {
    const chats = await this.chatService.getUserChats(await this.chatIdentity.resolve(user));
    return { success: true, data: chats };
  }

  @Get(':chatId/messages')
  async getMessages(
    @CurrentUser() user: any,
    @Param('chatId') chatId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const result = await this.chatService.getMessages(
      chatId,
      await this.chatIdentity.resolve(user),
      page || 1,
      limit || 20,
    );
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
    
    const baseUrl = process.env.APP_URL || process.env.API_URL || 'http://localhost:3001';
    const fileUrl = `${baseUrl}/uploads/chat/${file.filename}`;
    return { success: true, fileUrl };
  }
}

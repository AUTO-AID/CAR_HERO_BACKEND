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

  /**
   * **بلا تغليف يدوي.** `TransformInterceptor` مسجَّل عالمياً في `core.module`
   * ويلفّ كل ردّ بـ`{success,data,timestamp}`؛ فإضافة `{success,data}` هنا
   * كانت تُنتج `{success,data:{success,data:<chat>}}`.
   *
   * والتطبيقان كانا يتعايشان معه بحيلة `created?.data || created` — أي أن
   * العقد المعلن غير العقد المنفَّذ، وأول من يقرأ `id` مباشرةً يجده `undefined`
   * بلا خطأ يدلّ عليه. نفس التصحيح الذي جرى في `notifications.controller`.
   *
   * الحيلة في الطرفين تبقى صحيحة بعد الإصلاح: `chat.data` تصير `undefined`
   * فيسقط التعبير إلى `chat` نفسه.
   */
  @Post('conversations')
  async startConversation(@CurrentUser() user: any, @Body() dto: CreateChatDto) {
    return this.chatService.getOrCreateChat(
      // الطلب هو ما يحسم الهويّة: صاحب حساب فنّي يطلب من تطبيق العميل يدخل
      // المحادثة بحسابه لا بوثيقة مزوّده — انظر `ChatIdentityService.candidates`
      await this.chatIdentity.resolveForOrder(user, dto.orderId),
      dto.participantId,
      dto.orderId,
    );
  }

  @Get('conversations')
  async getMyConversations(@CurrentUser() user: any) {
    // كل هويّات الحساب: من له حساب فنّي وطلبات كعميل يجب أن يرى النوعين معاً
    return this.chatService.getUserChats(await this.chatIdentity.candidates(user));
  }

  @Get(':chatId/messages')
  async getMessages(
    @CurrentUser() user: any,
    @Param('chatId') chatId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.chatService.getMessages(
      chatId,
      await this.chatIdentity.resolveForChat(user, chatId),
      page || 1,
      limit || 20,
    );
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
    return { fileUrl };
  }
}

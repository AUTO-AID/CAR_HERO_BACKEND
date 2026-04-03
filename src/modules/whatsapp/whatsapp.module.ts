import { Module, Global } from '@nestjs/common';
import { WhatsAppWebService } from './services/whatsapp-web.service';
import { WhatsAppController } from './controllers/whatsapp.controller';

@Global() // جعله Global لاستخدامه في Auth Module
@Module({
  controllers: [WhatsAppController],
  providers: [WhatsAppWebService],
  exports: [WhatsAppWebService],
})
export class WhatsAppModule {}
